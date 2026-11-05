import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { interactions, matches, messages, profiles } from "@/db/schema";
import { ensureSeed, getAppState } from "@/lib/server-state";
import type { DiscoveryAction } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await ensureSeed();
    const body = (await request.json()) as { action?: DiscoveryAction | "undo"; profileId?: string };

    if (body.action === "undo") {
      const [latest] = await db
        .select()
        .from(interactions)
        .where(eq(interactions.memberId, "alex"))
        .orderBy(desc(interactions.id))
        .limit(1);
      if (!latest) return NextResponse.json({ error: "Nothing to undo" }, { status: 400 });

      await db.delete(interactions).where(eq(interactions.id, latest.id));
      const [match] = await db
        .select()
        .from(matches)
        .where(and(eq(matches.memberId, "alex"), eq(matches.profileId, latest.profileId)))
        .limit(1);
      if (match?.origin === "discovery") {
        const conversation = await db.select({ id: messages.id }).from(messages).where(eq(messages.matchId, match.id));
        const hasConversation = conversation.length > 1;
        if (!hasConversation) await db.delete(matches).where(eq(matches.id, match.id));
      }
      return NextResponse.json({ state: await getAppState(), restoredProfileId: latest.profileId });
    }

    if (!body.profileId || !["like", "pass", "superlike"].includes(body.action ?? "")) {
      return NextResponse.json({ error: "A profile and valid action are required" }, { status: 400 });
    }
    const action = body.action as DiscoveryAction;
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, body.profileId)).limit(1);
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    await db
      .insert(interactions)
      .values({ memberId: "alex", profileId: profile.id, action, createdAt: new Date() })
      .onConflictDoUpdate({
        target: [interactions.memberId, interactions.profileId],
        set: { action, createdAt: new Date() },
      });

    let matchId: string | undefined;
    if ((action === "like" || action === "superlike") && profile.likesYou) {
      matchId = `match_${profile.id}`;
      const inserted = await db
        .insert(matches)
        .values({
          id: matchId,
          memberId: "alex",
          profileId: profile.id,
          origin: "discovery",
          unread: 0,
          createdAt: new Date(),
          lastMessageAt: new Date(),
        })
        .onConflictDoNothing()
        .returning({ id: matches.id });
      if (inserted.length > 0) {
        await db.insert(messages).values({
          matchId,
          sender: "system",
          body: `You and ${profile.name} liked each other. Start with something specific from their profile.`,
        });
      }
    }

    return NextResponse.json({
      state: await getAppState(),
      outcome: { action, profileId: profile.id, matchId },
    });
  } catch (error) {
    console.error("Interaction failed", error);
    return NextResponse.json({ error: "Could not save that action" }, { status: 500 });
  }
}
