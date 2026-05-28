import { env } from "../config/env.js";

type MailPayload = {
  to: string;
  toName?: string;
  subject: string;
  html: string;
};

export const sendMail = async ({ to, toName, subject, html }: MailPayload) => {
  if (!env.BREVO_API_KEY || !env.MAIL_SENDER_EMAIL) {
    console.warn(`Mail skipped for ${to}: mail settings are missing`);
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: env.MAIL_SENDER_EMAIL, name: env.MAIL_SENDER_NAME },
        to: [{ email: to, name: toName }],
        subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Brevo mail failed: ${response.status} ${text}`);
    }
  } catch (error) {
    console.error("Brevo mail failed", error);
  }
};

export const sendOtpMail = (email: string, name: string, code: string, subject: string) =>
  sendMail({
    to: email,
    toName: name,
    subject,
    html: `<p>Hello ${name},</p><p>Your GreenBean OTP is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`,
  });
