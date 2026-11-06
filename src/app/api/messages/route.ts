import { and, eq, isNull, ne, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { matches, members, messages } from "@/db/schema";
import { maybeScheduleDemoReply } from "@/lib/demo";
import { rateLimit } from "@/lib/rate-limit";
import { getApiUser } from "@/lib/session";
import { getAppState } from "@/lib/server-state";
import { firstIssue, messageSchema, readSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

async function matchForUser(matchId: string, userId: string) {
  const [match] = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.id, matchId),
        or(eq(matches.userAId, userId), eq(matches.userBId, userId)),
      ),
    )
    .limit(1);
  return match ?? null;
}

export async function POST(request: Request) {
  try {
    const current = await getApiUser();
    if (!current) return NextResponse.json({ error: "Sign in to send a message" }, { status: 401 });

    const limit = rateLimit(`message:${current.id}`, 40, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "You are sending messages very quickly. Take a breath and try in a minute." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const parsed = messageSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
    }
    const { matchId, text } = parsed.data;

    const match = await matchForUser(matchId, current.id);
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    const partnerId = match.userAId === current.id ? match.userBId : match.userAId;

    await db.insert(messages).values({
      matchId: match.id,
      senderId: current.id,
      body: text,
      createdAt: new Date(),
    });
    await db
      .update(matches)
      .set({ lastMessageAt: new Date() })
      .where(eq(matches.id, match.id));

    const [partner] = await db
      .select({ isDemo: members.isDemo })
      .from(members)
      .where(eq(members.id, partnerId))
      .limit(1);
    if (partner?.isDemo) void maybeScheduleDemoReply(match.id, partnerId);

    return NextResponse.json({ state: await getAppState(current.id) });
  } catch (error) {
    console.error("Message failed", error);
    return NextResponse.json({ error: "Message could not be sent" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const current = await getApiUser();
    if (!current) return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });

    const parsed = readSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
    }

    const match = await matchForUser(parsed.data.matchId, current.id);
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(messages.matchId, match.id),
          ne(messages.senderId, current.id),
          isNull(messages.readAt),
        ),
      );

    return NextResponse.json({ state: await getAppState(current.id) });
  } catch (error) {
    console.error("Read receipt failed", error);
    return NextResponse.json({ error: "Could not update conversation" }, { status: 500 });
  }
}
