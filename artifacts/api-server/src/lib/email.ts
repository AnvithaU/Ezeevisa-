import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "./logger";
import type { OtpPurpose } from "@workspace/db";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

let transporter: Transporter | null = null;

if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  const port = Number(SMTP_PORT);
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export function isEmailConfigured(): boolean {
  return transporter !== null;
}

function purposeCopy(purpose: OtpPurpose): { title: string; intro: string } {
  if (purpose === "email_verification") {
    return {
      title: "Verify your email",
      intro:
        "Welcome to VisaPath! Use the code below to verify your email address and activate your account.",
    };
  }
  return {
    title: "Your sign-in code",
    intro:
      "Use the code below to finish signing in to your VisaPath account. If you didn't try to sign in, you can ignore this email.",
  };
}

function renderOtpHtml(code: string, purpose: OtpPurpose): string {
  const { title, intro } = purposeCopy(purpose);
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f7f6f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f6f2;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e5df;">
            <tr>
              <td style="background-color:#01696f;padding:24px 32px;">
                <span style="color:#ffffff;font-size:20px;font-weight:700;">Visa<span style="color:#a5e3e6;">Path</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:20px;color:#1a1a1a;">${title}</h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#555;">${intro}</p>
                <div style="text-align:center;margin:0 0 24px;">
                  <div style="display:inline-block;background-color:#f0f6f6;border:1px solid #cfe5e6;border-radius:12px;padding:16px 28px;">
                    <span style="font-size:32px;font-weight:700;letter-spacing:10px;color:#01696f;">${code}</span>
                  </div>
                </div>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#777;">This code expires in <strong>10 minutes</strong> and can be used only once. Never share it with anyone.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #eee;">
                <p style="margin:0;font-size:12px;color:#999;">&copy; ${new Date().getFullYear()} VisaPath — Smart e-Visa Portal</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: OtpPurpose,
): Promise<void> {
  if (!transporter) {
    logger.warn(
      { to, purpose, code },
      "SMTP not configured — OTP email not sent. Code logged for development only.",
    );
    return;
  }

  await transporter.sendMail({
    from: SMTP_FROM || "VisaPath <no-reply@visapath.app>",
    to,
    subject: `Your VisaPath verification code: ${code}`,
    text: `Your VisaPath verification code is ${code}. It expires in 10 minutes and can be used only once.`,
    html: renderOtpHtml(code, purpose),
  });
}
