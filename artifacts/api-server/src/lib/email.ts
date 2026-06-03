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
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
  </head>
  <body style="margin:0;padding:0;background-color:#0a1628;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a1628;padding:40px 0;">
      <tr>
        <td align="center" style="padding:0 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#0e1d36;border-radius:24px;overflow:hidden;border:1px solid rgba(201,168,76,0.22);">
            <!-- Brand bar -->
            <tr>
              <td style="padding:28px 36px 22px;border-bottom:1px solid rgba(201,168,76,0.16);">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#c9a84c,#8b6914);text-align:center;line-height:42px;color:#0a1628;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;">VP</div>
                    </td>
                    <td style="vertical-align:middle;padding-left:14px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:600;letter-spacing:3px;color:#f5f0e8;">VISA<span style="color:#c9a84c;">PATH</span></td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:36px;">
                <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:600;color:#f5f0e8;">${title}</h1>
                <p style="margin:0 0 28px;font-size:14px;line-height:1.7;color:rgba(245,240,232,0.6);">${intro}</p>
                <div style="text-align:center;margin:0 0 28px;">
                  <div style="display:inline-block;background-color:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.3);border-radius:14px;padding:18px 34px;">
                    <span style="font-size:34px;font-weight:600;letter-spacing:12px;color:#e8c97a;font-family:'DM Sans',Helvetica,Arial,sans-serif;">${code}</span>
                  </div>
                </div>
                <p style="margin:0;font-size:13px;line-height:1.7;color:rgba(245,240,232,0.45);">This code expires in <strong style="color:rgba(245,240,232,0.7);">10 minutes</strong> and can be used only once. If you didn't request it, you can safely ignore this email — never share this code with anyone.</p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:18px 36px;border-top:1px solid rgba(201,168,76,0.12);">
                <p style="margin:0;font-size:12px;color:rgba(245,240,232,0.35);">&copy; ${year} VisaPath — Smart e-Visa Portal. This is an automated message; please do not reply.</p>
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
    if (process.env.NODE_ENV === "production") {
      // Fail closed in production: never log the plaintext code, and throw so
      // the caller surfaces a 502 instead of silently "succeeding".
      logger.error(
        { to, purpose },
        "SMTP not configured in production — OTP email could not be sent.",
      );
      throw new Error("Email delivery is not configured");
    }
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
