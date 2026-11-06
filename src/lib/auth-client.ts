"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Talks to the Better Auth route handler at /api/auth/*. Cookies are httpOnly
 * and set by the server; the client never sees session tokens.
 */
export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined" ? window.location.origin : undefined,
});

export const { signIn, signUp, signOut, useSession, requestPasswordReset, resetPassword } =
  authClient;
