import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*  Authentication (Better Auth — open source, self-hosted)                    */
/* -------------------------------------------------------------------------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("account_user_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

/* -------------------------------------------------------------------------- */
/*  Member profile — one row per account                                      */
/* -------------------------------------------------------------------------- */

export const members = pgTable("members", {
  /** Same id as the Better Auth user id. */
  id: text("id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull().default("Prefer not to say"),
  city: text("city").notNull().default("London"),
  area: text("area").notNull().default(""),
  lat: real("lat").notNull().default(51.5072),
  lng: real("lng").notNull().default(-0.1276),
  occupation: text("occupation").notNull().default(""),
  bio: text("bio").notNull().default(""),
  photo: text("photo").notNull().default(""),
  photoAlt: text("photo_alt").notNull().default(""),
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  interests: jsonb("interests").$type<string[]>().notNull().default([]),
  languages: jsonb("languages").$type<string[]>().notNull().default([]),
  lookingFor: text("looking_for").notNull().default("Long-term relationship"),
  promptQuestion: text("prompt_question").notNull().default("We will get along if"),
  promptAnswer: text("prompt_answer").notNull().default(""),
  idealSunday: text("ideal_sunday").notNull().default(""),
  height: text("height").notNull().default(""),
  education: text("education").notNull().default(""),
  drinking: text("drinking").notNull().default("Socially"),
  smoking: text("smoking").notNull().default("Never"),
  workout: text("workout").notNull().default(""),
  anthem: text("anthem").notNull().default(""),
  verified: boolean("verified").notNull().default(false),
  isDemo: boolean("is_demo").notNull().default(false),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  showOnline: boolean("show_online").notNull().default(true),
  readReceipts: boolean("read_receipts").notNull().default(true),
  notifications: boolean("notifications").notNull().default(true),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const preferences = pgTable("preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  minAge: integer("min_age").notNull().default(24),
  maxAge: integer("max_age").notNull().default(36),
  maxDistance: integer("max_distance").notNull().default(25),
  lookingFor: text("looking_for").notNull().default("Any intention"),
  interests: jsonb("interests").$type<string[]>().notNull().default([]),
  verifiedOnly: boolean("verified_only").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  Discovery, matches & conversation                                         */
/* -------------------------------------------------------------------------- */

export const interactions = pgTable(
  "interactions",
  {
    id: serial("id").primaryKey(),
    fromUserId: text("from_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    toUserId: text("to_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("interaction_pair_idx").on(table.fromUserId, table.toUserId),
    index("interaction_to_idx").on(table.toUserId),
  ],
);

export const matches = pgTable(
  "matches",
  {
    id: text("id").primaryKey(),
    userAId: text("user_a_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userBId: text("user_b_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    origin: text("origin").notNull().default("discovery"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("match_pair_idx").on(table.userAId, table.userBId),
    index("match_user_a_idx").on(table.userAId),
    index("match_user_b_idx").on(table.userBId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    /** A user id, or "system" for the small notes Love Is My Heart writes into a new match. */
    senderId: text("sender_id").notNull(),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("message_match_idx").on(table.matchId, table.id)],
);

/* -------------------------------------------------------------------------- */
/*  Safety                                                                    */
/* -------------------------------------------------------------------------- */

export const blocks = pgTable(
  "blocks",
  {
    id: serial("id").primaryKey(),
    blockerId: text("blocker_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    blockedId: text("blocked_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("block_pair_idx").on(table.blockerId, table.blockedId)],
);

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: text("reporter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  reportedId: text("reported_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  details: text("details").notNull().default(""),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  Relations                                                                 */
/* -------------------------------------------------------------------------- */

export const membersRelations = relations(members, ({ one }) => ({
  user: one(user, { fields: [members.id], references: [user.id] }),
}));

export const matchesRelations = relations(matches, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  match: one(matches, { fields: [messages.matchId], references: [matches.id] }),
}));

export const fullSchema = {
  user,
  session,
  account,
  verification,
  members,
  preferences,
  interactions,
  matches,
  messages,
  blocks,
  reports,
};
