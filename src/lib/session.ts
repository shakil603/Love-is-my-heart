import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ensureDatabase } from "@/db/setup";
import { auth } from "@/lib/auth";

/** Reads the Better Auth session from the httpOnly session cookie. */
export const getAuthSession = cache(async () => {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch (error) {
    console.error("Session lookup failed", error);
    return null;
  }
});

/** For server components: sends signed-out visitors to the sign-in page. */
export async function requireSession(next = "/app") {
  const session = await getAuthSession();
  if (!session) redirect(`/signin?next=${encodeURIComponent(next)}`);
  return session;
}

/** For route handlers: returns the signed-in user or null. */
export async function getApiUser() {
  await ensureDatabase();
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function requireApiUser() {
  const current = await getApiUser();
  return current;
}
