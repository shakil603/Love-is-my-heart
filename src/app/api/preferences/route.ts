import { NextResponse } from "next/server";
import { db } from "@/db";
import { preferences } from "@/db/schema";
import { getApiUser } from "@/lib/session";
import { getAppState } from "@/lib/server-state";
import { firstIssue, preferencesSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    const current = await getApiUser();
    if (!current) {
      return NextResponse.json({ error: "Sign in to save preferences" }, { status: 401 });
    }

    const parsed = preferencesSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
    }
    const input = parsed.data;
    const minAge = Math.min(input.minAge, input.maxAge);
    const maxAge = Math.max(input.minAge, input.maxAge);

    const values = {
      userId: current.id,
      minAge,
      maxAge,
      maxDistance: input.maxDistance,
      lookingFor: input.lookingFor,
      interests: input.interests,
      verifiedOnly: input.verifiedOnly,
      updatedAt: new Date(),
    };

    await db
      .insert(preferences)
      .values(values)
      .onConflictDoUpdate({ target: preferences.userId, set: values });

    return NextResponse.json({ state: await getAppState(current.id) });
  } catch (error) {
    console.error("Preference update failed", error);
    return NextResponse.json({ error: "Could not save preferences" }, { status: 500 });
  }
}
