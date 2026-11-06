import { and, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { blocks, interactions, matches, reports } from "@/db/schema";
import { getApiUser } from "@/lib/session";
import { getAppState } from "@/lib/server-state";
import { firstIssue, reportSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const current = await getApiUser();
    if (!current) return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });

    const parsed = reportSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
    }
    const { userId, reason, details, block } = parsed.data;
    if (userId === current.id) {
      return NextResponse.json({ error: "You cannot report yourself" }, { status: 400 });
    }

    await db.insert(reports).values({
      reporterId: current.id,
      reportedId: userId,
      reason,
      details,
    });

    if (block) {
      await db
        .insert(blocks)
        .values({ blockerId: current.id, blockedId: userId })
        .onConflictDoNothing();
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
    }

    return NextResponse.json({
      state: await getAppState(current.id),
      received: true,
    });
  } catch (error) {
    console.error("Report failed", error);
    return NextResponse.json({ error: "Could not send that report" }, { status: 500 });
  }
}
