import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { matches, messages } from "@/db/schema";

/** Matches are stored once per pair, with the ids sorted for a stable key. */
export function matchPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function findMatchBetween(a: string, b: string) {
  const [userAId, userBId] = matchPair(a, b);
  const [match] = await db
    .select()
    .from(matches)
    .where(and(eq(matches.userAId, userAId), eq(matches.userBId, userBId)))
    .limit(1);
  return match ?? null;
}

export async function createMatchBetween(
  a: string,
  b: string,
  origin: "discovery" | "seed" = "discovery",
  at = Date.now(),
) {
  const existing = await findMatchBetween(a, b);
  if (existing) return { id: existing.id, created: false };

  const [userAId, userBId] = matchPair(a, b);
  const id = `match_${crypto.randomUUID()}`;
  const createdAt = new Date(at);
  await db
    .insert(matches)
    .values({ id, userAId, userBId, origin, createdAt, lastMessageAt: createdAt })
    .onConflictDoNothing();

  const stored = await findMatchBetween(a, b);
  return { id: stored?.id ?? id, created: Boolean(stored?.id === id) };
}

export async function announceMatch(matchId: string, partnerName: string) {
  await db.insert(messages).values({
    matchId,
    senderId: "system",
    body: `You and ${partnerName} liked each other. Start with something specific from their profile.`,
  });
}
