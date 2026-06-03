import crypto from "crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db, otpCodesTable, type OtpPurpose } from "@workspace/db";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function generateOtpCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * Generate, hash and persist a fresh OTP for the given user + purpose.
 * Returns the raw (un-hashed) code so the caller can email it.
 */
export async function createOtp(
  userId: number,
  purpose: OtpPurpose,
): Promise<string> {
  const code = generateOtpCode();
  await db.insert(otpCodesTable).values({
    userId,
    codeHash: hashCode(code),
    purpose,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });
  return code;
}

/**
 * Returns the number of seconds the caller must wait before a new code can be
 * requested, or 0 if a resend is allowed right now.
 */
export async function getResendWaitSeconds(
  userId: number,
  purpose: OtpPurpose,
): Promise<number> {
  const cutoff = new Date(Date.now() - RESEND_COOLDOWN_MS);
  const [recent] = await db
    .select({ createdAt: otpCodesTable.createdAt })
    .from(otpCodesTable)
    .where(
      and(
        eq(otpCodesTable.userId, userId),
        eq(otpCodesTable.purpose, purpose),
        gt(otpCodesTable.createdAt, cutoff),
      ),
    )
    .orderBy(desc(otpCodesTable.createdAt))
    .limit(1);

  if (!recent) return 0;
  const elapsed = Date.now() - recent.createdAt.getTime();
  return Math.max(0, Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000));
}

export type VerifyOtpResult = { ok: true } | { ok: false; error: string };

/**
 * Verify the latest active OTP for a user + purpose. Enforces hash match,
 * expiry, and single-use (marks the code as used on success).
 */
export async function verifyOtp(
  userId: number,
  purpose: OtpPurpose,
  rawCode: string,
): Promise<VerifyOtpResult> {
  const [row] = await db
    .select()
    .from(otpCodesTable)
    .where(
      and(
        eq(otpCodesTable.userId, userId),
        eq(otpCodesTable.purpose, purpose),
        isNull(otpCodesTable.usedAt),
      ),
    )
    .orderBy(desc(otpCodesTable.createdAt))
    .limit(1);

  if (!row) {
    return { ok: false, error: "No active code. Please request a new one." };
  }

  if (row.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "This code has expired. Please request a new one." };
  }

  if (row.codeHash !== hashCode(rawCode)) {
    return { ok: false, error: "Invalid code. Please check and try again." };
  }

  await db
    .update(otpCodesTable)
    .set({ usedAt: new Date() })
    .where(eq(otpCodesTable.id, row.id));

  return { ok: true };
}
