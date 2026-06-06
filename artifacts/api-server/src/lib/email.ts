import nodemailer from "nodemailer";
import { logger } from "./logger";
import type { OtpPurpose } from "@workspace/db";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function renderOtpHtml(code: string, purpose: OtpPurpose) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>EzeVisas OTP Verification</h2>
      <p><strong>Purpose:</strong> ${purpose}</p>
      <h1 style="letter-spacing: 8px; font-size: 32px;">
        ${code}
      </h1>
      <p>This code expires in 10 minutes.</p>
      <p>– EzeVisas</p>
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
    await transporter.sendMail({
      from: `EzeVisas <${process.env.GMAIL_USER}>`,
      to,
      subject: "Your EzeVisas OTP Code",
      html: renderOtpHtml(code, purpose),
    });

    console.log("📧 OTP EMAIL SENT SUCCESSFULLY");
  } catch (err) {
    logger.error({ err }, "❌ Failed to send OTP via Gmail");
    throw new Error("OTP email failed");
  }
}
