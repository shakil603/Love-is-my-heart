import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  city: text("city").notNull(),
  neighborhood: text("neighborhood").notNull(),
  distance: real("distance").notNull(),
  occupation: text("occupation").notNull(),
  bio: text("bio").notNull(),
  photo: text("photo").notNull(),
  photoAlt: text("photo_alt").notNull(),
  interests: jsonb("interests").$type<string[]>().notNull(),
  languages: jsonb("languages").$type<string[]>().notNull(),
  lookingFor: text("looking_for").notNull(),
  promptQuestion: text("prompt_question").notNull(),
  promptAnswer: text("prompt_answer").notNull(),
  idealSunday: text("ideal_sunday").notNull(),
  verified: boolean("verified").notNull().default(false),
  likesYou: boolean("likes_you").notNull().default(false),
  newHere: boolean("new_here").notNull().default(false),
  lastActive: text("last_active").notNull(),
  height: text("height").notNull(),
  education: text("education").notNull(),
  drinking: text("drinking").notNull(),
  smoking: text("smoking").notNull(),
  workout: text("workout").notNull(),
  anthem: text("anthem").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const interactions = pgTable(
  "interactions",
  {
    id: serial("id").primaryKey(),
    memberId: text("member_id").notNull().default("alex"),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("interaction_member_profile_idx").on(table.memberId, table.profileId)],
);

export const matches = pgTable("matches", {
  id: text("id").primaryKey(),
  memberId: text("member_id").notNull().default("alex"),
  profileId: text("profile_id")
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: "cascade" }),
  origin: text("origin").notNull().default("discovery"),
  unread: integer("unread").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  matchId: text("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const preferences = pgTable("preferences", {
  id: text("id").primaryKey().default("alex"),
  minAge: integer("min_age").notNull().default(24),
  maxAge: integer("max_age").notNull().default(36),
  maxDistance: integer("max_distance").notNull().default(25),
  lookingFor: text("looking_for").notNull().default("Long-term relationship"),
  interests: jsonb("interests").$type<string[]>().notNull().default([]),
  verifiedOnly: boolean("verified_only").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const members = pgTable("members", {
  id: text("id").primaryKey().default("alex"),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  city: text("city").notNull(),
  bio: text("bio").notNull(),
  photo: text("photo").notNull(),
  lookingFor: text("looking_for").notNull(),
  interests: jsonb("interests").$type<string[]>().notNull(),
  showOnline: boolean("show_online").notNull().default(true),
  readReceipts: boolean("read_receipts").notNull().default(true),
  notifications: boolean("notifications").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const matchesRelations = relations(matches, ({ one, many }) => ({
  profile: one(profiles, { fields: [matches.profileId], references: [profiles.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  match: one(matches, { fields: [messages.matchId], references: [matches.id] }),
}));
