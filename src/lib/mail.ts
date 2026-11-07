import nodemailer, { type Transporter } from "nodemailer";

/**
 * Optional SMTP delivery. When no SMTP credentials are configured (the normal
 * local/preview setup) the email is written to the server log instead, so the
 * password-reset flow can still be exercised without an external service.
 */
let transporter: Transporter | null | undefined;

function getTransporter() {
  if (transporter !== undefined) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD ?? process.env.SMTP_PASS;

  if (!host) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport(
    process.env.SMTP_URL
      ? { url: process.env.SMTP_URL }
      : {
          host,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: process.env.SMTP_SECURE === "true",
          auth: user ? { user, pass } : undefined,
        },
  );
  return transporter;
}

export function appUrl(path = "") {
  const base =
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  return new URL(path, base).toString();
}

export async function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const from = process.env.SMTP_FROM ?? "Love Is My Heart <hello@limh.local>";
  const client = getTransporter();

  if (!client) {
    console.info(`\n[limh mail] To: ${to}\n[limh mail] Subject: ${subject}\n${text}\n`);
    return;
  }

  await client.sendMail({ from, to, subject, text, html: html ?? `<p>${text}</p>` });
}

export function passwordResetEmail(url: string) {
  return {
    subject: "Reset your Love Is My Heart password",
    text: `Someone asked to reset the password for this Love Is My Heart account. If it was you, open this link within the next hour: ${url}\n\nIf it wasn't you, you can safely ignore this email.`,
  };
}

export function verifyEmailEmail(url: string) {
  return {
    subject: "Confirm your email for Love Is My Heart",
    text: `Welcome to Love Is My Heart. Confirm your email address to finish setting up your account: ${url}`,
  };
}
