import nodemailer from 'nodemailer';

// Clean password by removing spaces if copied from Google App Passwords
function getSmtpPassword(): string {
  const pass = process.env.SMTP_PASS || 'vxmw xhzbgnzxfoyf';
  return pass.replace(/\s+/g, '');
}

export function createMailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE !== 'false';
  const user = process.env.SMTP_USER || 'anilarangi6@gmail.com';
  const pass = getSmtpPassword();

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendOtpEmail({
  to,
  otp,
  name,
}: {
  to: string;
  otp: string;
  name?: string | null;
}) {
  const transporter = createMailTransporter();
  const from = process.env.SMTP_FROM || `MovieMan Admin <${process.env.SMTP_USER || 'anilarangi6@gmail.com'}>`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MovieMan Admin Password Reset</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0A0E17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 16px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #111726; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">🎬 MovieMan Admin</h1>
                  <p style="margin: 6px 0 0; color: rgba(255, 255, 255, 0.85); font-size: 13px; font-weight: 500;">Secure Portal Authorization</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 32px 28px;">
                  <p style="margin: 0 0 16px; font-size: 15px; color: #F1F5F9; line-height: 1.5;">
                    Hello <strong>${name || 'Admin'}</strong>,
                  </p>
                  <p style="margin: 0 0 24px; font-size: 14px; color: #94A3B8; line-height: 1.6;">
                    A password reset request was initiated for your MovieMan Admin account (<strong>${to}</strong>). Use the verification code below to set a new password.
                  </p>

                  <!-- OTP Code Box -->
                  <div style="background-color: #070A12; border: 1px dashed #DC2626; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #EF4444; font-weight: 700; margin-bottom: 8px;">
                      Verification Code (OTP)
                    </div>
                    <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #FFFFFF; font-family: 'Courier New', monospace;">
                      ${otp}
                    </div>
                    <div style="font-size: 12px; color: #F59E0B; margin-top: 10px; font-weight: 600;">
                      ⏳ Valid for 10 minutes only
                    </div>
                  </div>

                  <p style="margin: 0 0 16px; font-size: 13px; color: #94A3B8; line-height: 1.5;">
                    • Once reset, all your existing active sessions will be automatically logged out.<br/>
                    • If you did not request this, you can safely ignore this email. Your current password remains unchanged.
                  </p>

                  <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); margin-top: 28px; padding-top: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #64748B;">
                      MovieMan Admin Portal &bull; Automated Security Dispatch
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from,
    to,
    subject: `🔐 MovieMan Admin - Password Reset OTP (${otp})`,
    text: `Your MovieMan Admin Password Reset OTP is: ${otp}. It expires in 10 minutes. If you did not request this, please ignore.`,
    html,
  });

  return info;
}
