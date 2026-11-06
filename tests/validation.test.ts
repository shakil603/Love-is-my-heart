import { describe, expect, it } from "vitest";
import { interactionSchema, memberSchema, messageSchema } from "@/lib/validation";

const validMember = {
  name: "Rafi",
  age: 29,
  gender: "Man",
  city: "Dhaka",
  area: "Dhanmondi",
  occupation: "Engineer",
  bio: "I build small things and cook too much. Looking for something honest.",
  photos: [],
  interests: ["Cooking", "Bookshops", "Travel slowly"],
  languages: ["English", "Bengali"],
  lookingFor: "Long-term relationship",
  promptQuestion: "A perfect first date",
  promptAnswer: "A market and a long walk.",
  idealSunday: "Coffee and a walk.",
  height: "5 10",
  education: "BUET",
  drinking: "Rarely",
  smoking: "Never",
  workout: "Running",
  anthem: "Nina Simone",
  showOnline: true,
  readReceipts: true,
  notifications: true,
  onboardingComplete: true,
};

describe("member validation", () => {
  it("accepts a complete adult profile", () => {
    expect(memberSchema.safeParse(validMember).success).toBe(true);
  });

  it("rejects minors", () => {
    expect(memberSchema.safeParse({ ...validMember, age: 17 }).success).toBe(false);
  });

  it("rejects short bios", () => {
    expect(memberSchema.safeParse({ ...validMember, bio: "Too short" }).success).toBe(false);
  });

  it("rejects photos that are not our uploads", () => {
    expect(
      memberSchema.safeParse({ ...validMember, photos: ["https://evil.example.com/x.jpg"] })
        .success,
    ).toBe(false);
  });
});

describe("request validation", () => {
  it("allows the four discovery behaviours", () => {
    for (const action of ["like", "pass", "superlike", "undo"] as const) {
      expect(interactionSchema.safeParse({ action }).success).toBe(true);
    }
    expect(interactionSchema.safeParse({ action: "marry" }).success).toBe(false);
  });

  it("keeps messages within the database contract", () => {
    expect(messageSchema.safeParse({ matchId: "m1", text: "Hello" }).success).toBe(true);
    expect(messageSchema.safeParse({ matchId: "m1", text: "" }).success).toBe(false);
    expect(messageSchema.safeParse({ matchId: "m1", text: "x".repeat(1001) }).success).toBe(false);
  });
});
