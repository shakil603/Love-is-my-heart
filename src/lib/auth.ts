import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { account, session, user, verification } from "@/db/schema";
import { passwordResetEmail, sendMail, verifyEmailEmail } from "@/lib/mail";

const env = process.env;

/**
 * Origins allowed to talk to the auth endpoints. The wildcard entries keep the
 * sandbox/preview deployments working; add your production domain through
 * BETTER_AUTH_TRUSTED_ORIGINS (comma separated).
 */
const trustedOrigins = [
  ...(env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://*.e2b.app",
  "https://*.arena.ai",
];

export const auth = betterAuth({
  appName: "Love Is My Heart",
  baseURL: env.BETTER_AUTH_URL
    ? env.BETTER_AUTH_URL
    : {
        // Works on localhost and on the per-session preview hosts used by the
        // sandbox. Deployments should set BETTER_AUTH_URL explicitly.
        allowedHosts: [
          "localhost",
          "localhost:3000",
          "127.0.0.1",
          "127.0.0.1:3000",
          "*.e2b.app",
          "*.arena.ai",
        ],
        fallback: "http://localhost:3000",
      },
  secret:
    env.BETTER_AUTH_SECRET ??
    // A stable development fallback keeps previews usable. Always set a real
    // secret (openssl rand -base64 32) before deploying.
    "limh-development-secret-change-me-before-deploying-please",
  database: drizzleAdapter(db as never, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    sendResetPassword: async ({ user: target, url }) => {
      const mail = passwordResetEmail(url);
      await sendMail({ to: target.email, ...mail });
    },
    resetPasswordTokenExpiresIn: 60 * 60,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user: target, url }) => {
      const mail = verifyEmailEmail(url);
      await sendMail({ to: target.email, ...mail });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
  },
  trustedOrigins,
  advanced: {
    trustedProxyHeaders: true,
    database: { generateId: () => crypto.randomUUID() },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
