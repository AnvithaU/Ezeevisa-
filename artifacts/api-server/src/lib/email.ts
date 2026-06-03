import { Resend } from "resend";
import type { OtpPurpose } from "@workspace/db";
import { logger } from "./logger";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn("❌ RESEND_API_KEY is missing");
}

const resend = new Resend(apiKey);

function renderOtpHtml(code: string, purpose: OtpPurpose) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>VisaPath OTP Verification</h2>
      <p><strong>Purpose:</strong> ${purpose}</p>
      <h1 style="letter-spacing: 8px; font-size: 32px;">
        ${code}
      </h1>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;
}

export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: OtpPurpose,
): Promise<void> {
  console.log("📨 Sending OTP email to:", to);

  try {
    const result = await resend.emails.send({
      from: "onboarding@resend.dev",
      to,
      subject: "Your VisaPath OTP Code",
      html: renderOtpHtml(code, purpose),
    });

    console.log("📧 EMAIL SENT SUCCESSFULLY:", result);
  } catch (err) {
    logger.error({ err }, "❌ Failed to send OTP via Resend");
    throw new Error("OTP email failed");
  }
}
