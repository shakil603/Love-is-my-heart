import { z } from "zod";
import { INTERESTS, INTENTIONS } from "@/lib/catalog";

const interestValues = [...INTERESTS] as [string, ...string[]];
const intentionValues = [...INTENTIONS] as [string, ...string[]];

export const interactionSchema = z.object({
  action: z.enum(["like", "pass", "superlike", "undo"]),
  profileId: z.string().min(1).max(200).optional(),
});

export const messageSchema = z.object({
  matchId: z.string().min(1).max(200),
  text: z.string().trim().min(1, "Write a message first").max(1000, "Messages are limited to 1,000 characters"),
});

export const readSchema = z.object({
  matchId: z.string().min(1).max(200),
});

export const preferencesSchema = z.object({
  minAge: z.coerce.number().int().min(18).max(90),
  maxAge: z.coerce.number().int().min(18).max(90),
  maxDistance: z.coerce.number().int().min(1).max(500),
  lookingFor: z.enum(intentionValues),
  interests: z.array(z.enum(interestValues)).max(8).catch([]),
  verifiedOnly: z.boolean().catch(false),
});

const photoSchema = z
  .string()
  .max(500)
  .refine(
    (value) =>
      /^\/uploads\/[a-zA-Z0-9._-]+$/.test(value) ||
      /^https:\/\/images\.pexels\.com\/photos\/\d+\/pexels-photo-\d+\.jpeg(\?[^\s"']*)?$/.test(value),
    "Uploaded photos only",
  );

export const memberSchema = z.object({
  name: z.string().trim().min(2, "Add your first name").max(40),
  age: z.coerce.number().int().min(18, "You must be 18 or older").max(99),
  gender: z.string().trim().min(1).max(40).catch("Prefer not to say"),
  city: z.string().trim().min(1).max(80),
  area: z.string().trim().max(80).catch(""),
  occupation: z.string().trim().max(80).catch(""),
  bio: z.string().trim().min(20, "Share at least a couple of sentences").max(500),
  photos: z.array(photoSchema).max(4),
  interests: z.array(z.enum(interestValues)).max(6).catch([]),
  languages: z.array(z.string().trim().min(1).max(30)).max(6).catch([]),
  lookingFor: z.enum(intentionValues),
  promptQuestion: z.string().trim().max(120).catch("We will get along if"),
  promptAnswer: z.string().trim().max(300).catch(""),
  idealSunday: z.string().trim().max(400).catch(""),
  height: z.string().trim().max(20).catch(""),
  education: z.string().trim().max(120).catch(""),
  drinking: z.string().trim().max(40).catch("Socially"),
  smoking: z.string().trim().max(40).catch("Never"),
  workout: z.string().trim().max(60).catch(""),
  anthem: z.string().trim().max(120).catch(""),
  showOnline: z.boolean().catch(true),
  readReceipts: z.boolean().catch(true),
  notifications: z.boolean().catch(true),
  onboardingComplete: z.boolean().catch(false),
});

export const blockSchema = z.object({
  userId: z.string().min(1).max(200),
  blocked: z.boolean(),
});

export const reportSchema = z.object({
  userId: z.string().min(1).max(200),
  reason: z.string().trim().min(1).max(120),
  details: z.string().trim().max(1000).catch(""),
  block: z.boolean().catch(true),
});

export const accountSchema = z.object({
  confirm: z.literal("DELETE"),
});

/** Returns a compact, user-safe error message from a Zod failure. */
export function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "That information does not look right";
}
