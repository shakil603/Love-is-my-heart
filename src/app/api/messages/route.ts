import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { matches, messages } from "@/db/schema";
import { ensureSeed, getAppState } from "@/lib/server-state";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await ensureSeed();
    const body = (await request.json()) as { matchId?: string; text?: string };
    const text = body.text?.trim();
    if (!body.matchId || !text) return NextResponse.json({ error: "Write a message first" }, { status: 400 });
    if (text.length > 1000) return NextResponse.json({ error: "Messages are limited to 1,000 characters" }, { status: 400 });
    const [match] = await db.select().from(matches).where(eq(matches.id, body.matchId)).limit(1);
    if (!match || match.memberId !== "alex") return NextResponse.json({ error: "Match not found" }, { status: 404 });
    await db.insert(messages).values({ matchId: match.id, sender: "you", body: text, createdAt: new Date() });
    await db.update(matches).set({ unread: 0, lastMessageAt: new Date() }).where(eq(matches.id, match.id));
    return NextResponse.json({ state: await getAppState() });
  } catch (error) {
    console.error("Message failed", error);
    return NextResponse.json({ error: "Message could not be sent" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureSeed();
    const body = (await request.json()) as { matchId?: string };
    if (!body.matchId) return NextResponse.json({ error: "Match is required" }, { status: 400 });
    await db.update(matches).set({ unread: 0 }).where(eq(matches.id, body.matchId));
    return NextResponse.json({ state: await getAppState() });
  } catch {
    return NextResponse.json({ error: "Could not update conversation" }, { status: 500 });
  }
}
