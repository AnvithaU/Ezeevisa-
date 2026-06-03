import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { OtpPurpose } from "@workspace/db";

const JWT_SECRET = process.env.SESSION_SECRET || "visapath-secret-key";

export interface AuthRequest extends Request {
  userId?: number;
}

export interface PendingTokenPayload {
  userId: number;
  purpose: OtpPurpose;
  pending: true;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      pending?: boolean;
    };
    if (payload.pending) {
      res.status(401).json({ error: "Email verification required" });
      return;
    }
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

export function generatePendingToken(
  userId: number,
  purpose: OtpPurpose
): string {
  return jwt.sign({ userId, purpose, pending: true }, JWT_SECRET, {
    expiresIn: "15m",
  });
}

export function verifyPendingToken(token: string): PendingTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as Partial<PendingTokenPayload>;
    if (
      payload.pending === true &&
      typeof payload.userId === "number" &&
      (payload.purpose === "email_verification" || payload.purpose === "login")
    ) {
      return {
        userId: payload.userId,
        purpose: payload.purpose,
        pending: true,
      };
    }
    return null;
  } catch {
    return null;
  }
}
