const KEY = "visapath_otp_pending";

export type OtpPurpose = "email_verification" | "login";

export interface OtpSession {
  pendingToken: string;
  purpose: OtpPurpose;
  email: string;
}

export function setOtpSession(session: OtpSession): void {
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function getOtpSession(): OtpSession | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OtpSession;
  } catch {
    return null;
  }
}

export function clearOtpSession(): void {
  sessionStorage.removeItem(KEY);
}
