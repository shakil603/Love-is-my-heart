import { and, desc, eq, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { blocks, interactions, matches as matchesTable, members, messages, preferences } from "@/db/schema";
import { maybeDemoReciprocate } from "@/lib/demo";
import { announceMatch, createMatchBetween, findMatchBetween } from "@/lib/matches";
import { rateLimit } from "@/lib/rate-limit";
import { getApiUser } from "@/lib/session";
import { passesPreferences } from "@/lib/matching";
import { getAppState, OnboardingRequiredError, serializeProfile } from "@/lib/server-state";
import type { DiscoveryAction } from "@/lib/types";
import { firstIssue, interactionSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const current = await getApiUser();
    if (!current) return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });

    const limit = rateLimit(`interaction:${current.id}`, 150, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Give yourself a moment before the next choice." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const parsed = interactionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
    }
    const body = parsed.data;

    if (body.action === "undo") {
      const [latest] = await db
        .select()
        .from(interactions)
        .where(eq(interactions.fromUserId, current.id))
        .orderBy(desc(interactions.id))
        .limit(1);
      if (!latest) return NextResponse.json({ error: "Nothing to undo" }, { status: 400 });

      await db.delete(interactions).where(eq(interactions.id, latest.id));

      const match = await findMatchBetween(current.id, latest.toUserId);
      if (match?.origin === "discovery") {
        const conversation = await db
          .select({ id: messages.id })
          .from(messages)
          .where(eq(messages.matchId, match.id));
        if (conversation.length <= 1) {
          await db.delete(messages).where(eq(messages.matchId, match.id));
          await db.delete(matchesTable).where(eq(matchesTable.id, match.id));
        }
      }

      return NextResponse.json({
        state: await getAppState(current.id),
        restoredProfileId: latest.toUserId,
      });
    }

    if (!body.profileId) {
      return NextResponse.json({ error: "A profile is required" }, { status: 400 });
    }
    const action = body.action as DiscoveryAction;

    if (body.profileId === current.id) {
      return NextResponse.json({ error: "That is your own profile" }, { status: 400 });
    }

    const [viewer] = await db
      .select()
      .from(members)
      .where(eq(members.id, current.id))
      .limit(1);
    const [target] = await db
      .select()
      .from(members)
      .where(eq(members.id, body.profileId))
      .limit(1);
    if (!viewer) throw new OnboardingRequiredError();
    if (!target || !target.onboardingComplete) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const [blocked] = await db
      .select({ id: blocks.id })
      .from(blocks)
      .where(
        or(
          and(eq(blocks.blockerId, current.id), eq(blocks.blockedId, target.id)),
          and(eq(blocks.blockerId, target.id), eq(blocks.blockedId, current.id)),
        ),
      )
      .limit(1);
    if (blocked) return NextResponse.json({ error: "This profile is not available" }, { status: 403 });

    const [preference] = await db
      .select()
      .from(preferences)
      .where(eq(preferences.userId, current.id))
      .limit(1);
    const preferencesState = {
      id: current.id,
      minAge: preference?.minAge ?? 18,
      maxAge: preference?.maxAge ?? 60,
      maxDistance: preference?.maxDistance ?? 150,
      lookingFor: preference?.lookingFor ?? "Any intention",
      interests: preference?.interests ?? [],
      verifiedOnly: preference?.verifiedOnly ?? false,
    };
    if (!passesPreferences(serializeProfile(target, viewer, false), preferencesState)) {
      return NextResponse.json(
        { error: "This person is outside your current filters" },
        { status: 400 },
      );
    }

    await db
      .insert(interactions)
      .values({ fromUserId: current.id, toUserId: target.id, action, createdAt: new Date() })
      .onConflictDoUpdate({
        target: [interactions.fromUserId, interactions.toUserId],
        set: { action, createdAt: new Date() },
      });

    let matchId: string | undefined;

    if (action === "like" || action === "superlike") {
      const [reciprocal] = await db
        .select({ id: interactions.id })
        .from(interactions)
        .where(
          and(
            eq(interactions.fromUserId, target.id),
            eq(interactions.toUserId, current.id),
            inArray(interactions.action, ["like", "superlike"]),
          ),
        )
        .limit(1);

      if (reciprocal) {
        const { id, created } = await createMatchBetween(current.id, target.id, "discovery");
        matchId = id;
        if (created) await announceMatch(id, target.name);
      } else if (target.isDemo) {
        // Sample profiles sometimes reciprocate, based on shared interests.
        matchId =
          (await maybeDemoReciprocate(
            current.id,
            viewer.interests,
            target,
            action === "superlike",
          )) ?? undefined;
      }
    }

    return NextResponse.json({
      state: await getAppState(current.id),
      outcome: { action, profileId: target.id, matchId },
    });
  } catch (error) {
    if (error instanceof OnboardingRequiredError) {
      return NextResponse.json({ error: error.message, onboarding: true }, { status: 409 });
    }
    console.error("Interaction failed", error);
    return NextResponse.json({ error: "Could not save that action" }, { status: 500 });
  }
}
