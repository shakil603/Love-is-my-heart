import { and, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { blocks, interactions, matches } from "@/db/schema";
import { getApiUser } from "@/lib/session";
import { getAppState } from "@/lib/server-state";
import { blockSchema, firstIssue } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const current = await getApiUser();
    if (!current) return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });

    const parsed = blockSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
    }
    const { userId, blocked } = parsed.data;
    if (userId === current.id) {
      return NextResponse.json({ error: "You cannot block yourself" }, { status: 400 });
    }

    if (blocked) {
      await db
        .insert(blocks)
        .values({ blockerId: current.id, blockedId: userId })
        .onConflictDoNothing();

      // Blocking is also an unmatch: remove the connection and its messages.
      await db
        .delete(interactions)
        .where(
          or(
            and(eq(interactions.fromUserId, current.id), eq(interactions.toUserId, userId)),
            and(eq(interactions.fromUserId, userId), eq(interactions.toUserId, current.id)),
          ),
        );
      await db
        .delete(matches)
        .where(
          or(
            and(eq(matches.userAId, current.id), eq(matches.userBId, userId)),
            and(eq(matches.userAId, userId), eq(matches.userBId, current.id)),
          ),
        );
    } else {
      await db
        .delete(blocks)
        .where(and(eq(blocks.blockerId, current.id), eq(blocks.blockedId, userId)));
    }

    return NextResponse.json({ state: await getAppState(current.id), blocked });
  } catch (error) {
    console.error("Block failed", error);
    return NextResponse.json({ error: "Could not update this setting" }, { status: 500 });
  }
}
