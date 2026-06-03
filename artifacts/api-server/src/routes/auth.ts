import { Router, IRouter } from "express";
import bcrypt from "bcrypt";
import { eq, or } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";
import { db, usersTable } from "@workspace/db";
import { RegisterBody, LoginBody, VerifyOtpBody, ResendOtpBody } from "@workspace/api-zod";
import {
  requireAuth,
  generateToken,
  generatePendingToken,
  verifyPendingToken,
  type AuthRequest,
} from "../middlewares/auth";
import { createOtp, verifyOtp, getResendWaitSeconds } from "../lib/otp";
import { sendOtpEmail } from "../lib/email";

const router: IRouter = Router();

const rawGoogleClientId = (process.env.GOOGLE_CLIENT_ID || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
const googleClient = new OAuth2Client(rawGoogleClientId);

router.get("/auth/config", (_req, res): void => {
  let clientId = process.env.GOOGLE_CLIENT_ID || "";
  clientId = clientId.replace(/^https?:\/\//, "").replace(/\/$/, "");
  res.json({ googleClientId: clientId });
});

function userResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: (user as any).avatarUrl ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password, firstName, lastName, phone } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(usersTable)
    .values({
      email,
      passwordHash,
      firstName,
      lastName,
      phone: phone ?? null,
      emailVerified: false,
    })
    .returning();

  const code = await createOtp(user.id, "email_verification");
  try {
    await sendOtpEmail(user.email, code, "email_verification");
  } catch (err) {
    req.log.error({ err }, "Failed to send verification OTP email");
    // Roll back the half-created account so the user can retry cleanly.
    // OTP rows cascade-delete with the user.
    await db.delete(usersTable).where(eq(usersTable.id, user.id));
    res.status(502).json({
      error:
        "We couldn't send your verification email right now. Please try again in a moment.",
    });
    return;
  }

  const pendingToken = generatePendingToken(user.id, "email_verification");
  res.status(200).json({
    status: "otp_required",
    pendingToken,
    purpose: "email_verification",
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (!user.passwordHash) {
    res.status(401).json({ error: "This account uses Google Sign-In. Please sign in with Google." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  // Unverified accounts must complete email verification before they can
  // access protected areas. Re-issue a verification OTP and route them through
  // the same verify-otp flow used at registration.
  if (!user.emailVerified) {
    const code = await createOtp(user.id, "email_verification");
    try {
      await sendOtpEmail(user.email, code, "email_verification");
    } catch (err) {
      req.log.error({ err }, "Failed to send verification OTP email");
      res.status(502).json({
        error:
          "We couldn't send your verification email right now. Please try again in a moment.",
      });
      return;
    }

    const pendingToken = generatePendingToken(user.id, "email_verification");
    res.status(200).json({
      status: "otp_required",
      pendingToken,
      purpose: "email_verification",
    });
    return;
  }

  // Verified credentials → issue a session directly. No OTP on every login.
  const token = generateToken(user.id);
  res.status(200).json({ token, user: userResponse(user) });
});

router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { pendingToken, code } = parsed.data;
  const pending = verifyPendingToken(pendingToken);
  if (!pending) {
    res.status(401).json({ error: "Your session has expired. Please sign in again." });
    return;
  }

  const result = await verifyOtp(pending.userId, pending.purpose, code);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  if (pending.purpose === "email_verification") {
    await db
      .update(usersTable)
      .set({ emailVerified: true })
      .where(eq(usersTable.id, pending.userId));
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, pending.userId))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Account not found." });
    return;
  }

  const token = generateToken(user.id);
  res.json({ token, user: userResponse(user) });
});

router.post("/auth/resend-otp", async (req, res): Promise<void> => {
  const parsed = ResendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const pending = verifyPendingToken(parsed.data.pendingToken);
  if (!pending) {
    res.status(401).json({ error: "Your session has expired. Please sign in again." });
    return;
  }

  const wait = await getResendWaitSeconds(pending.userId, pending.purpose);
  if (wait > 0) {
    res.status(429).json({
      error: `Please wait ${wait} second${wait === 1 ? "" : "s"} before requesting a new code.`,
    });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, pending.userId))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Account not found." });
    return;
  }

  const code = await createOtp(pending.userId, pending.purpose);
  try {
    await sendOtpEmail(user.email, code, pending.purpose);
  } catch (err) {
    req.log.error({ err }, "Failed to resend OTP email");
    res.status(502).json({
      error:
        "We couldn't send your verification email right now. Please try again in a moment.",
    });
    return;
  }

  res.json({ status: "otp_sent", message: "A new code has been sent to your email." });
});

router.post("/auth/google", async (req, res): Promise<void> => {
  const { credential } = req.body;
  if (!credential) {
    res.status(400).json({ error: "Google credential is required" });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: rawGoogleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: "Invalid Google token" });
      return;
    }

    const { sub: googleId, email, given_name, family_name, picture } = payload;
    const firstName = given_name || email.split("@")[0];
    const lastName = family_name || "";

    const existing = await db
      .select()
      .from(usersTable)
      .where(or(eq(usersTable.googleId, googleId), eq(usersTable.email, email)))
      .limit(1);

    let user: typeof usersTable.$inferSelect;

    if (existing.length > 0) {
      const updates: Partial<typeof usersTable.$inferInsert> = {
        googleId,
        emailVerified: true,
      };
      if (picture) (updates as any).avatarUrl = picture;
      [user] = await db
        .update(usersTable)
        .set(updates as any)
        .where(eq(usersTable.id, existing[0].id))
        .returning();
    } else {
      [user] = await db
        .insert(usersTable)
        .values({
          email,
          passwordHash: "",
          firstName,
          lastName,
          googleId,
          emailVerified: true,
          ...(picture ? { avatarUrl: picture } : {}),
        } as any)
        .returning();
    }

    const token = generateToken(user.id);
    res.json({ token, user: userResponse(user) });
  } catch (err: any) {
    console.error("Google auth error:", err);
    res.status(401).json({ error: "Google authentication failed" });
  }
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json(userResponse(user));
});

export default router;
