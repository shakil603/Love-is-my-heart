import { describe, expect, it } from "vitest";
import { distanceLabel, findCity, haversineKm, nearestCity } from "@/lib/cities";
import { getMatchInsight, intentionAligns, passesPreferences } from "@/lib/matching";
import type { Member, Preferences, Profile } from "@/lib/types";

const preferences: Preferences = {
  id: "viewer",
  minAge: 24,
  maxAge: 38,
  maxDistance: 500,
  lookingFor: "Long-term relationship",
  interests: ["Cooking"],
  verifiedOnly: false,
};

const member: Member = {
  id: "viewer",
  name: "Rafi",
  age: 29,
  gender: "Man",
  city: "London",
  area: "Hackney",
  bio: "A long enough bio to be considered complete.",
  photo: "/placeholder.jpg",
  photos: [],
  lookingFor: "Long-term relationship",
  interests: ["Cooking", "Bookshops", "Travel slowly"],
  occupation: "Engineer",
  languages: ["English"],
  promptQuestion: "A perfect first date",
  promptAnswer: "A market and a long walk.",
  idealSunday: "Coffee and a walk.",
  height: "5 10",
  education: "BUET",
  drinking: "Rarely",
  smoking: "Never",
  workout: "Running",
  anthem: "Nina Simone",
  verified: true,
  isDemo: false,
  onboardingComplete: true,
  showOnline: true,
  readReceipts: true,
  notifications: true,
};

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "other",
    name: "Nadia",
    age: 28,
    gender: "Woman",
    city: "London",
    area: "Islington",
    neighborhood: "Islington",
    distance: 2.4,
    occupation: "Architect",
    bio: "A profile bio that is specific and warm.",
    photo: "/placeholder.jpg",
    photoAlt: "Photo of Nadia",
    photos: [],
    interests: ["Cooking", "Architecture"],
    languages: ["English"],
    lookingFor: "Long-term relationship",
    promptQuestion: "We will get along if",
    promptAnswer: "You notice the small details.",
    idealSunday: "Market then gallery.",
    verified: true,
    likesYou: false,
    newHere: false,
    isDemo: false,
    lastActive: "Active now",
    height: "5 5",
    education: "UCL",
    drinking: "Socially",
    smoking: "Never",
    workout: "Yoga",
    anthem: "Sade",
    ...overrides,
  };
}

describe("distance", () => {
  it("computes the great-circle distance between London and Paris", () => {
    const london = findCity("London")!;
    const paris = findCity("Paris")!;
    const km = haversineKm(london, paris);
    expect(km).toBeGreaterThan(330);
    expect(km).toBeLessThan(360);
  });

  it("finds the nearest supported city", () => {
    expect(nearestCity(23.81, 90.41).name).toBe("Dhaka");
    expect(nearestCity(24.75, 90.42).name).toBe("Mymensingh");
  });

  it("labels same-city and distant connections honestly", () => {
    expect(distanceLabel(0)).toBe("Same city");
    expect(distanceLabel(3.44)).toBe("3.4 km away");
    expect(distanceLabel(344)).toBe("344 km away");
  });
});

describe("compatibility", () => {
  it("only aligns intentions that can work together", () => {
    expect(intentionAligns("Any intention", "New friends")).toBe(true);
    expect(intentionAligns("Long-term relationship", "Long-term, open to short")).toBe(true);
    expect(intentionAligns("Long-term relationship", "Short-term, open to long")).toBe(true);
    expect(intentionAligns("Long-term relationship", "New friends")).toBe(false);
  });

  it("filters by age, distance, intention and interests", () => {
    expect(passesPreferences(profile(), preferences)).toBe(true);
    expect(passesPreferences(profile({ age: 45 }), preferences)).toBe(false);
    expect(passesPreferences(profile({ distance: 900 }), preferences)).toBe(false);
    expect(passesPreferences(profile({ lookingFor: "New friends" }), preferences)).toBe(false);
    expect(passesPreferences(profile({ interests: ["Gardening"] }), preferences)).toBe(false);
    expect(
      passesPreferences(profile({ verified: false }), { ...preferences, verifiedOnly: true }),
    ).toBe(false);
  });

  it("explains the score and keeps it inside a believable range", () => {
    const insight = getMatchInsight(profile(), member, preferences);
    expect(insight.score).toBeGreaterThanOrEqual(46);
    expect(insight.score).toBeLessThanOrEqual(99);
    expect(insight.shared).toContain("Cooking");
    expect(insight.reasons[0]).toContain("shared interest");
    expect(insight.reasons.join(" ")).toContain("intentions align");
  });
});
