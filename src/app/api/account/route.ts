import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getApiUser } from "@/lib/session";
import { accountSchema, firstIssue } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Deletes the account and, through ON DELETE CASCADE, the profile, photos,
 * preferences, interactions, matches, messages, blocks and reports.
 */
export async function DELETE(request: Request) {
  try {
    const current = await getApiUser();
    if (!current) return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });

    const parsed = accountSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
    }

    // Clear the session cookie first, then remove the account. Every row that
    // belongs to this person goes with it through ON DELETE CASCADE.
    const signOutResponse = await auth.api.signOut({
      headers: await headers(),
      asResponse: true,
    });

    await db.delete(user).where(eq(user.id, current.id));

    const response = NextResponse.json({ deleted: true });
    signOutResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        response.headers.append("set-cookie", value);
      }
    });
    return response;
  } catch (error) {
    console.error("Account deletion failed", error);
    return NextResponse.json({ error: "Could not delete the account" }, { status: 500 });
  }
}
