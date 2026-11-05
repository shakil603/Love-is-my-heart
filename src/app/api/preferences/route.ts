import { NextResponse } from "next/server";
import { db } from "@/db";
import { preferences } from "@/db/schema";
import { ensureSeed, getAppState } from "@/lib/server-state";
import { INTENTIONS, INTERESTS } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    await ensureSeed();
    const body = (await request.json()) as Partial<{
      minAge: number;
      maxAge: number;
      maxDistance: number;
      lookingFor: string;
      interests: string[];
      verifiedOnly: boolean;
    }>;
    const minAge = Math.max(18, Math.min(80, Math.round(Number(body.minAge ?? 24))));
    const maxAge = Math.max(minAge, Math.min(90, Math.round(Number(body.maxAge ?? 36))));
    const values = {
      id: "alex",
      minAge,
      maxAge,
      maxDistance: Math.max(1, Math.min(100, Math.round(Number(body.maxDistance ?? 25)))),
      lookingFor: INTENTIONS.includes(body.lookingFor as (typeof INTENTIONS)[number])
        ? (body.lookingFor as string)
        : "Any intention",
      interests: Array.isArray(body.interests)
        ? body.interests.filter((interest) => INTERESTS.includes(interest as (typeof INTERESTS)[number])).slice(0, 8)
        : [],
      verifiedOnly: Boolean(body.verifiedOnly),
      updatedAt: new Date(),
    };
    await db.insert(preferences).values(values).onConflictDoUpdate({ target: preferences.id, set: values });
    return NextResponse.json({ state: await getAppState() });
  } catch (error) {
    console.error("Preference update failed", error);
    return NextResponse.json({ error: "Could not save preferences" }, { status: 500 });
  }
}
