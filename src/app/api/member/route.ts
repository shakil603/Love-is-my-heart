import { NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { INTERESTS } from "@/lib/catalog";
import { ensureSeed, getAppState } from "@/lib/server-state";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    await ensureSeed();
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 40) : "Alex";
    const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 500) : "";
    if (name.length < 2 || bio.length < 20) {
      return NextResponse.json({ error: "Add a name and a bio of at least 20 characters" }, { status: 400 });
    }
    const values = {
      id: "alex",
      name,
      age: Math.max(18, Math.min(90, Math.round(Number(body.age ?? 29)))),
      city: typeof body.city === "string" ? body.city.trim().slice(0, 60) : "London",
      bio,
      lookingFor: typeof body.lookingFor === "string" && ["Long-term relationship", "Long-term, open to short", "Short-term, open to long", "New friends"].includes(body.lookingFor) ? body.lookingFor : "Long-term relationship",
      interests: Array.isArray(body.interests)
        ? body.interests.filter((item): item is string => typeof item === "string" && INTERESTS.includes(item as (typeof INTERESTS)[number])).slice(0, 6)
        : [],
      showOnline: body.showOnline !== false,
      readReceipts: body.readReceipts !== false,
      notifications: body.notifications !== false,
      updatedAt: new Date(),
    };
    await db.insert(members).values({ ...values, photo: "" }).onConflictDoUpdate({ target: members.id, set: values });
    return NextResponse.json({ state: await getAppState() });
  } catch (error) {
    console.error("Profile update failed", error);
    return NextResponse.json({ error: "Could not save profile" }, { status: 500 });
  }
}
