import { and, asc, desc, eq, inArray, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { ensureDatabase } from "@/db/setup";
import {
  blocks,
  interactions,
  matches,
  members,
  messages,
  preferences,
  user,
} from "@/db/schema";
import { demoModeEnabled } from "@/lib/demo";
import { haversineKm } from "@/lib/cities";
import { passesPreferences } from "@/lib/matching";
import type {
  AppState,
  Interaction,
  Match,
  Member,
  Message,
  Preferences,
  Profile,
} from "@/lib/types";

export class OnboardingRequiredError extends Error {
  constructor() {
    super("Finish setting up your profile first");
    this.name = "OnboardingRequiredError";
  }
}

const DAY = 24 * 60 * 60 * 1000;

function lastActiveLabel(row: typeof members.$inferSelect) {
  if (!row.showOnline) return "Recently active";
  const elapsed = Date.now() - row.lastActiveAt.getTime();
  if (elapsed < 5 * 60 * 1000) return "Active now";
  if (elapsed < 60 * 60 * 1000) return `Active ${Math.max(1, Math.round(elapsed / 60000))}m ago`;
  if (elapsed < DAY) return "Active today";
  if (elapsed < 7 * DAY) return "Active this week";
  return "Recently active";
}

export function serializeProfile(
  row: typeof members.$inferSelect,
  viewer: typeof members.$inferSelect,
  likesYou: boolean,
): Profile {
  const distance = haversineKm(
    { lat: viewer.lat, lng: viewer.lng },
    { lat: row.lat, lng: row.lng },
  );
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    gender: row.gender,
    city: row.city,
    area: row.area,
    neighborhood: row.area,
    distance: Math.round(distance * 10) / 10,
    occupation: row.occupation,
    bio: row.bio,
    photo: row.photo || "/placeholder.jpg",
    photoAlt: row.photoAlt || `Photo of ${row.name}`,
    photos: row.photos.length ? row.photos : row.photo ? [row.photo] : [],
    interests: row.interests,
    languages: row.languages,
    lookingFor: row.lookingFor,
    promptQuestion: row.promptQuestion,
    promptAnswer: row.promptAnswer,
    idealSunday: row.idealSunday,
    verified: row.verified,
    likesYou,
    newHere: Date.now() - row.createdAt.getTime() < 14 * DAY,
    isDemo: row.isDemo,
    lastActive: lastActiveLabel(row),
    height: row.height,
    education: row.education,
    drinking: row.drinking,
    smoking: row.smoking,
    workout: row.workout,
    anthem: row.anthem,
  };
}

function serializeMember(
  row: typeof members.$inferSelect,
  email: string,
  emailVerified: boolean,
): Member {
  return {
    id: row.id,
    email,
    name: row.name,
    age: row.age,
    gender: row.gender,
    city: row.city,
    area: row.area,
    bio: row.bio,
    photo: row.photo || "/placeholder.jpg",
    photos: row.photos.length ? row.photos : row.photo ? [row.photo] : [],
    lookingFor: row.lookingFor,
    interests: row.interests,
    occupation: row.occupation,
    languages: row.languages,
    promptQuestion: row.promptQuestion,
    promptAnswer: row.promptAnswer,
    idealSunday: row.idealSunday,
    height: row.height,
    education: row.education,
    drinking: row.drinking,
    smoking: row.smoking,
    workout: row.workout,
    anthem: row.anthem,
    // A member counts as verified once they have confirmed their email address.
    verified: row.verified || emailVerified,
    isDemo: row.isDemo,
    onboardingComplete: row.onboardingComplete,
    showOnline: row.showOnline,
    readReceipts: row.readReceipts,
    notifications: row.notifications,
  };
}

const activityWrites = new Map<string, number>();

function touchActivity(viewerId: string) {
  const last = activityWrites.get(viewerId) ?? 0;
  if (Date.now() - last < 60_000) return;
  activityWrites.set(viewerId, Date.now());
  void db
    .update(members)
    .set({ lastActiveAt: new Date() })
    .where(eq(members.id, viewerId))
    .catch(() => undefined);
}

export async function getMemberRow(userId: string) {
  await ensureDatabase();
  const [row] = await db.select().from(members).where(eq(members.id, userId)).limit(1);
  return row ?? null;
}

export async function getAppState(viewerId: string): Promise<AppState> {
  await ensureDatabase();

  const [viewerRow] = await db
    .select()
    .from(members)
    .where(eq(members.id, viewerId))
    .limit(1);
  if (!viewerRow) throw new OnboardingRequiredError();

  touchActivity(viewerId);

  const [authUser] = await db
    .select({ email: user.email, emailVerified: user.emailVerified })
    .from(user)
    .where(eq(user.id, viewerId))
    .limit(1);

  const [blockRows, preferenceRows, matchRows, viewerInteractionRows, likesYouRows] =
    await Promise.all([
      db
        .select()
        .from(blocks)
        .where(or(eq(blocks.blockerId, viewerId), eq(blocks.blockedId, viewerId))),
      db.select().from(preferences).where(eq(preferences.userId, viewerId)).limit(1),
      db
        .select()
        .from(matches)
        .where(or(eq(matches.userAId, viewerId), eq(matches.userBId, viewerId)))
        .orderBy(desc(matches.lastMessageAt)),
      db
        .select()
        .from(interactions)
        .where(eq(interactions.fromUserId, viewerId))
        .orderBy(desc(interactions.createdAt)),
      db
        .select()
        .from(interactions)
        .where(
          and(
            eq(interactions.toUserId, viewerId),
            inArray(interactions.action, ["like", "superlike"]),
          ),
        ),
    ]);

  const blockedIds = new Set(
    blockRows.map((row) => (row.blockerId === viewerId ? row.blockedId : row.blockerId)),
  );
  const likedBy = new Set(likesYouRows.map((row) => row.fromUserId));

  const preference = preferenceRows[0];
  const preferencesState: Preferences = {
    id: viewerId,
    minAge: preference?.minAge ?? 18,
    maxAge: preference?.maxAge ?? 60,
    maxDistance: preference?.maxDistance ?? 150,
    lookingFor: preference?.lookingFor ?? "Any intention",
    interests: preference?.interests ?? [],
    verifiedOnly: preference?.verifiedOnly ?? false,
  };

  const otherRows = await db
    .select()
    .from(members)
    .where(and(ne(members.id, viewerId), eq(members.onboardingComplete, true)));
  const unblockedRows = otherRows.filter((row) => !blockedIds.has(row.id));
  // Matches keep their partner even if the viewer later narrows their filters.
  const profileById = new Map(
    unblockedRows.map((row) => [row.id, serializeProfile(row, viewerRow, likedBy.has(row.id))]),
  );
  const visibleProfiles = [...profileById.values()].filter((profile) =>
    passesPreferences(profile, preferencesState),
  );

  const matchIds = matchRows.map((row) => row.id);
  const messageRows = matchIds.length
    ? await db
        .select()
        .from(messages)
        .where(inArray(messages.matchId, matchIds))
        .orderBy(asc(messages.id))
    : [];

  const matchState: Match[] = matchRows.flatMap((match) => {
    const partnerId = match.userAId === viewerId ? match.userBId : match.userAId;
    const profile = profileById.get(partnerId);
    if (!profile) return [];
    const conversation = messageRows.filter((message) => message.matchId === match.id);
    return [
      {
        id: match.id,
        profileId: partnerId,
        origin: match.origin,
        unread: conversation.filter(
          (message) => message.senderId === partnerId && !message.readAt,
        ).length,
        createdAt: match.createdAt.toISOString(),
        lastMessageAt: match.lastMessageAt.toISOString(),
        profile,
        messages: conversation.map(
          (message): Message => ({
            id: message.id,
            matchId: message.matchId,
            sender:
              message.senderId === "system"
                ? "system"
                : message.senderId === viewerId
                  ? "you"
                  : "them",
            body: message.body,
            createdAt: message.createdAt.toISOString(),
            readAt: message.readAt?.toISOString() ?? null,
          }),
        ),
      },
    ];
  });

  const interactionState: Interaction[] = viewerInteractionRows
    .filter((row) => profileById.has(row.toUserId) && row.action !== "pass")
    .map((row) => ({
      profileId: row.toUserId,
      action: row.action as Interaction["action"],
      createdAt: row.createdAt.toISOString(),
    }));

  // Passes are kept in `interactions` for undo, but the deck needs them too.
  const passes: Interaction[] = viewerInteractionRows
    .filter((row) => row.action === "pass")
    .map((row) => ({
      profileId: row.toUserId,
      action: "pass",
      createdAt: row.createdAt.toISOString(),
    }));

  return {
    profiles: visibleProfiles,
    matches: matchState,
    interactions: [...interactionState, ...passes],
    preferences: preferencesState,
    member: serializeMember(viewerRow, authUser?.email ?? "", Boolean(authUser?.emailVerified)),
    demoMode: demoModeEnabled(),
    blockedProfileIds: [...blockedIds],
  };
}

/** Lightweight polling payload used by the live-update stream. */
export async function getLiveFingerprint(viewerId: string) {
  const [matchRows, incoming] = await Promise.all([
    db
      .select({ id: matches.id, lastMessageAt: matches.lastMessageAt })
      .from(matches)
      .where(or(eq(matches.userAId, viewerId), eq(matches.userBId, viewerId))),
    db
      .select({ id: interactions.id })
      .from(interactions)
      .where(
        and(
          eq(interactions.toUserId, viewerId),
          inArray(interactions.action, ["like", "superlike"]),
        ),
      ),
  ]);

  const matchIds = matchRows.map((row) => row.id);
  const [lastMessage] = matchIds.length
    ? await db
        .select({ id: messages.id })
        .from(messages)
        .where(inArray(messages.matchId, matchIds))
        .orderBy(desc(messages.id))
        .limit(1)
    : [];

  return `${matchRows.length}:${incoming.length}:${lastMessage?.id ?? 0}`;
}
