import { and, desc, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "@/db";
import { account, interactions, matches, members, messages, preferences, user } from "@/db/schema";
import { DEMO_ACCOUNT, seedMember, seedPreferences, seedProfiles } from "@/lib/catalog";
import { DEFAULT_CITY, findCity } from "@/lib/cities";
import { announceMatch, createMatchBetween, findMatchBetween } from "@/lib/matches";
import type { Profile } from "@/lib/types";

/**
 * A demo community is seeded so a fresh install has something to look at.
 *
 * These are clearly marked sample profiles (`isDemo`), and the interface says
 * so. Their replies are generated locally from their own profile text — no
 * hidden human is pretending to be online, and no third-party AI service is
 * called. Set LIMH_DEMO_MODE=0 for a real, invite-only community.
 */
export function demoModeEnabled() {
  return process.env.LIMH_DEMO_MODE !== "0";
}

export function demoReplyEnabled() {
  return demoModeEnabled() && process.env.LIMH_DEMO_AUTOREPLY !== "0";
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function demoId(profileId: string) {
  return `demo-${profileId}`;
}

function demoEmail(profileId: string) {
  return `${profileId}@demo.limh.app`;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function profileToMember(
  profile: Profile | typeof seedMember,
  options: { id: string; daysAgo: number; activeMinutesAgo: number },
) {
  const home = findCity(profile.city) ?? DEFAULT_CITY;
  return {
    id: options.id,
    name: profile.name,
    age: profile.age,
    gender: "gender" in profile ? profile.gender : "Woman",
    city: home.name,
    area: profile.area || home.name,
    lat: home.lat,
    lng: home.lng,
    occupation: profile.occupation,
    bio: profile.bio,
    photo: profile.photo,
    photoAlt: "photoAlt" in profile ? profile.photoAlt : `Photo of ${profile.name}`,
    photos: profile.photos?.length ? profile.photos : [profile.photo],
    interests: profile.interests,
    languages: "languages" in profile ? profile.languages : ["English"],
    lookingFor: profile.lookingFor,
    promptQuestion: profile.promptQuestion,
    promptAnswer: profile.promptAnswer,
    idealSunday: profile.idealSunday,
    height: "height" in profile ? profile.height : "",
    education: "education" in profile ? profile.education : "",
    drinking: "drinking" in profile ? profile.drinking : "Socially",
    smoking: "smoking" in profile ? profile.smoking : "Never",
    workout: "workout" in profile ? profile.workout : "",
    anthem: "anthem" in profile ? profile.anthem : "",
    verified: true,
    isDemo: true,
    onboardingComplete: true,
    lastActiveAt: new Date(Date.now() - options.activeMinutesAgo * 60 * 1000),
    createdAt: new Date(Date.now() - options.daysAgo * DAY),
    updatedAt: new Date(),
  };
}

async function ensureUser(input: {
  id: string;
  name: string;
  email: string;
  password?: string;
  daysAgo: number;
}) {
  const createdAt = new Date(Date.now() - input.daysAgo * DAY);
  await db
    .insert(user)
    .values({
      id: input.id,
      name: input.name,
      email: input.email,
      emailVerified: true,
      createdAt,
      updatedAt: createdAt,
    })
    .onConflictDoNothing();

  if (input.password) {
    const password = await hashPassword(input.password);
    await db
      .insert(account)
      .values({
        id: crypto.randomUUID(),
        accountId: input.id,
        providerId: "credential",
        userId: input.id,
        password,
        createdAt,
        updatedAt: createdAt,
      })
      .onConflictDoNothing();
  }
}

async function seedDemoCommunity() {
  const [existing] = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.isDemo, true))
    .limit(1);
  if (existing) return;

  // The account behind the "Explore the live demo" button.
  await ensureUser({
    id: "demo-alex",
    name: DEMO_ACCOUNT.name,
    email: DEMO_ACCOUNT.email,
    password: DEMO_ACCOUNT.password,
    daysAgo: 40,
  });
  await db
    .insert(members)
    .values({
      ...profileToMember(seedMember, { id: "demo-alex", daysAgo: 40, activeMinutesAgo: 0 }),
    })
    .onConflictDoNothing();

  await db
    .insert(preferences)
    .values({
      userId: "demo-alex",
      minAge: seedPreferences.minAge,
      maxAge: seedPreferences.maxAge,
      maxDistance: 500,
      lookingFor: seedPreferences.lookingFor,
      interests: seedPreferences.interests,
      verifiedOnly: seedPreferences.verifiedOnly,
    })
    .onConflictDoNothing();

  const now = Date.now();
  const rows = seedProfiles.map((profile, index) => ({
    profile,
    id: demoId(profile.id),
    daysAgo: profile.newHere ? 3 + index : 35 + index * 7,
    activeMinutesAgo: index % 3 === 0 ? 0 : (index % 5) * 40 + 15,
  }));

  for (const row of rows) {
    await ensureUser({
      id: row.id,
      name: row.profile.name,
      email: demoEmail(row.profile.id),
      daysAgo: row.daysAgo,
    });
    await db
      .insert(members)
      .values(
        profileToMember(row.profile, {
          id: row.id,
          daysAgo: row.daysAgo,
          activeMinutesAgo: row.activeMinutesAgo,
        }),
      )
      .onConflictDoNothing();
  }

  // A handful of people have already liked the demo account.
  const admirers = ["maya", "theo", "noah", "amara", "elias", "june", "mateo"];
  await db
    .insert(interactions)
    .values(
      admirers.map((id) => ({
        fromUserId: demoId(id),
        toUserId: "demo-alex",
        action: "like",
        createdAt: new Date(now - 2 * DAY),
      })),
    )
    .onConflictDoNothing();

  // Two conversations already in progress.
  const theoMatch = await ensureMatch("demo-alex", "demo-theo", "seed", now - 2 * DAY);
  const amaraMatch = await ensureMatch("demo-alex", "demo-amara", "seed", now - 5 * DAY);

  const existingMessages = await db
    .select({ id: messages.id })
    .from(messages)
    .limit(1);
  if (existingMessages.length === 0) {
    await db.insert(messages).values([
      {
        matchId: theoMatch,
        senderId: "demo-theo",
        body: "Your note about travelling slowly caught my eye. What place would you go back to just for one meal?",
        createdAt: new Date(now - 30 * 60 * 1000),
      },
      {
        matchId: amaraMatch,
        senderId: "system",
        body: "You liked each other. A favourite trail and an unhurried Sunday sounded like a good place to begin.",
        createdAt: new Date(now - 5 * DAY),
      },
      {
        matchId: amaraMatch,
        senderId: "demo-alex",
        body: "Your ideal Sunday sounds dangerously close to mine. Where is your favourite trail near London?",
        readAt: new Date(now - 2 * HOUR),
        createdAt: new Date(now - 4 * HOUR),
      },
      {
        matchId: amaraMatch,
        senderId: "demo-amara",
        body: "The ridge walk around Hassocks. Proper lunch in Lewes afterwards is non-negotiable.",
        readAt: new Date(now - 90 * 60 * 1000),
        createdAt: new Date(now - 2 * HOUR),
      },
    ]);
  }

  await db
    .update(matches)
    .set({ lastMessageAt: new Date(now - 30 * 60 * 1000) })
    .where(eq(matches.id, theoMatch));
}

async function ensureMatch(aId: string, bId: string, origin: "discovery" | "seed", at = Date.now()) {
  const { id } = await createMatchBetween(aId, bId, origin, at);
  return id;
}

export async function seedDemoIfNeeded() {
  if (!demoModeEnabled()) return;
  await seedDemoCommunity();
}

/* -------------------------------------------------------------------------- */
/*  Sample-profile behaviour                                                  */
/* -------------------------------------------------------------------------- */

const replyTimers = new Map<string, ReturnType<typeof setTimeout>>();

function pickReply(profile: typeof members.$inferSelect, incoming: string) {
  const text = incoming.toLowerCase();
  const firstPrompt = profile.promptAnswer.split(/(?<=[.!?])\s+/)[0] ?? profile.promptAnswer;

  if (/food|cook|dinner|eat|meal|restaurant/.test(text)) {
    return `Now I want to know your one reliable dinner. Mine involves too much garlic and a very good loaf of bread.`;
  }
  if (/film|movie|cinema|watch/.test(text)) {
    return `I would happily watch something slow and beautiful, then argue about the ending for an hour. What is the last film that stayed with you?`;
  }
  if (/music|song|album|gig|band/.test(text)) {
    return `That question has made me put on ${profile.anthem || "something warm and loud"}. What is the song you would play on a long drive?`;
  }
  if (/travel|trip|train|city|place/.test(text)) {
    return `I keep a list of places that deserve more than a weekend. ${firstPrompt} Where would you go back to?`;
  }
  if (/\?$/.test(text.trim())) {
    return `Good question. ${firstPrompt} What about you?`;
  }
  return `I like that you asked that. ${firstPrompt}`;
}

/**
 * Schedules a sample profile's reply. Called after the member sends a message
 * to a demo account; harmless when the partner is a real person.
 */
export async function maybeScheduleDemoReply(matchId: string, demoUserId: string) {
  if (!demoReplyEnabled()) return;
  if (replyTimers.has(matchId)) return;

  const [profile] = await db
    .select()
    .from(members)
    .where(eq(members.id, demoUserId))
    .limit(1);
  if (!profile?.isDemo) return;

  const timer = setTimeout(async () => {
    replyTimers.delete(matchId);
    try {
      const [newest] = await db
        .select({ body: messages.body, senderId: messages.senderId })
        .from(messages)
        .where(eq(messages.matchId, matchId))
        .orderBy(desc(messages.id))
        .limit(1);
      if (!newest || newest.senderId === demoUserId) return;
      await db.insert(messages).values({
        matchId,
        senderId: demoUserId,
        body: pickReply(profile, newest.body),
      });
      await db
        .update(matches)
        .set({ lastMessageAt: new Date() })
        .where(eq(matches.id, matchId));
    } catch (error) {
      console.error("Sample reply failed", error);
    }
  }, 4500 + Math.round(Math.random() * 4000));

  replyTimers.set(matchId, timer);
}

/** A sample profile reciprocates based on shared interests, not every time. */
export async function maybeDemoReciprocate(
  viewerId: string,
  viewerInterests: string[],
  target: typeof members.$inferSelect,
  boosted = false,
) {
  if (!demoModeEnabled() || !target.isDemo) return null;

  const shared = target.interests.filter((interest) => viewerInterests.includes(interest));
  const [pair] = await db
    .select({ action: interactions.action })
    .from(interactions)
    .where(
      and(eq(interactions.fromUserId, target.id), eq(interactions.toUserId, viewerId)),
    )
    .limit(1);

  if (!pair) {
    const chance = hashString(`${target.id}:${viewerId}`) % 100;
    const interested = boosted || shared.length >= 2 || chance < 55;
    if (!interested) return null;
    await db
      .insert(interactions)
      .values({ fromUserId: target.id, toUserId: viewerId, action: "like" })
      .onConflictDoNothing();
  }

  const existing = await findMatchBetween(viewerId, target.id);
  if (existing) return existing.id;

  const { id: matchId, created } = await createMatchBetween(viewerId, target.id, "discovery");
  if (created) await announceMatch(matchId, target.name);
  return matchId;
}
