import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { interactions, matches, members, messages, preferences, profiles } from "@/db/schema";
import { seedMember, seedPreferences, seedProfiles } from "@/lib/catalog";
import type { AppState, Interaction, Match, Message, Profile } from "@/lib/types";

let seedPromise: Promise<void> | null = null;

async function seed() {
  await db.insert(profiles).values(seedProfiles).onConflictDoNothing();
  await db.insert(members).values(seedMember).onConflictDoNothing();
  await db.insert(preferences).values(seedPreferences).onConflictDoNothing();

  const createdAt = new Date();
  await db
    .insert(matches)
    .values([
      {
        id: "match_theo",
        profileId: "theo",
        origin: "seed",
        unread: 1,
        createdAt,
        lastMessageAt: createdAt,
      },
      {
        id: "match_amara",
        profileId: "amara",
        origin: "seed",
        unread: 0,
        createdAt: new Date(createdAt.getTime() - 86400000),
        lastMessageAt: new Date(createdAt.getTime() - 3600000),
      },
    ])
    .onConflictDoNothing();

  const existingMessages = await db.select({ id: messages.id }).from(messages).limit(1);
  if (existingMessages.length === 0) {
    await db.insert(messages).values([
      {
        matchId: "match_theo",
        sender: "them",
        body: "Your note about travelling slowly caught my eye. What place would you go back to just for one meal?",
        createdAt: new Date(createdAt.getTime() - 1800000),
      },
      {
        matchId: "match_amara",
        sender: "system",
        body: "You liked each other. A favourite trail and an unhurried Sunday sounded like a good place to begin.",
        createdAt: new Date(createdAt.getTime() - 86400000),
      },
      {
        matchId: "match_amara",
        sender: "you",
        body: "Your ideal Sunday sounds dangerously close to mine. Where is your favourite trail near London?",
        createdAt: new Date(createdAt.getTime() - 7200000),
      },
      {
        matchId: "match_amara",
        sender: "them",
        body: "The ridge walk around Hassocks. Proper lunch in Lewes afterwards is non-negotiable.",
        createdAt: new Date(createdAt.getTime() - 3600000),
      },
    ]);
  }
}

export async function ensureSeed() {
  if (!seedPromise) {
    seedPromise = seed().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

function serializeProfile(profile: typeof profiles.$inferSelect): Profile {
  return {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    gender: profile.gender,
    city: profile.city,
    neighborhood: profile.neighborhood,
    distance: profile.distance,
    occupation: profile.occupation,
    bio: profile.bio,
    photo: profile.photo,
    photoAlt: profile.photoAlt,
    interests: profile.interests,
    languages: profile.languages,
    lookingFor: profile.lookingFor,
    promptQuestion: profile.promptQuestion,
    promptAnswer: profile.promptAnswer,
    idealSunday: profile.idealSunday,
    verified: profile.verified,
    likesYou: profile.likesYou,
    newHere: profile.newHere,
    lastActive: profile.lastActive,
    height: profile.height,
    education: profile.education,
    drinking: profile.drinking,
    smoking: profile.smoking,
    workout: profile.workout,
    anthem: profile.anthem,
  };
}

export async function getAppState(): Promise<AppState> {
  await ensureSeed();
  const [profileRows, interactionRows, matchRows, messageRows, preferenceRows, memberRows] =
    await Promise.all([
      db.select().from(profiles).orderBy(asc(profiles.id)),
      db.select().from(interactions).where(eq(interactions.memberId, "alex")).orderBy(desc(interactions.createdAt)),
      db.select().from(matches).where(eq(matches.memberId, "alex")).orderBy(desc(matches.lastMessageAt)),
      db.select().from(messages).orderBy(asc(messages.createdAt), asc(messages.id)),
      db.select().from(preferences).where(eq(preferences.id, "alex")).limit(1),
      db.select().from(members).where(eq(members.id, "alex")).limit(1),
    ]);

  const profileMap = new Map(profileRows.map((profile) => [profile.id, serializeProfile(profile)]));
  const matchState: Match[] = matchRows.flatMap((match) => {
    const profile = profileMap.get(match.profileId);
    if (!profile) return [];
    return [
      {
        id: match.id,
        profileId: match.profileId,
        origin: match.origin,
        unread: match.unread,
        createdAt: match.createdAt.toISOString(),
        lastMessageAt: match.lastMessageAt.toISOString(),
        profile,
        messages: messageRows
          .filter((message) => message.matchId === match.id)
          .map(
            (message): Message => ({
              id: message.id,
              matchId: message.matchId,
              sender: message.sender as Message["sender"],
              body: message.body,
              createdAt: message.createdAt.toISOString(),
            }),
          ),
      },
    ];
  });

  const interactionState: Interaction[] = interactionRows.map((interaction) => ({
    profileId: interaction.profileId,
    action: interaction.action as Interaction["action"],
    createdAt: interaction.createdAt.toISOString(),
  }));

  const preference = preferenceRows[0];
  const member = memberRows[0];
  if (!preference || !member) throw new Error("Member state could not be initialised");

  return {
    profiles: profileRows.map(serializeProfile),
    matches: matchState,
    interactions: interactionState,
    preferences: {
      id: preference.id,
      minAge: preference.minAge,
      maxAge: preference.maxAge,
      maxDistance: preference.maxDistance,
      lookingFor: preference.lookingFor,
      interests: preference.interests,
      verifiedOnly: preference.verifiedOnly,
    },
    member: {
      id: member.id,
      name: member.name,
      age: member.age,
      city: member.city,
      bio: member.bio,
      photo: member.photo,
      lookingFor: member.lookingFor,
      interests: member.interests,
      showOnline: member.showOnline,
      readReceipts: member.readReceipts,
      notifications: member.notifications,
    },
  };
}
