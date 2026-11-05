import type { Member, Preferences, Profile } from "@/lib/types";

export type MatchInsight = {
  score: number;
  shared: string[];
  reasons: string[];
};

export function intentionAligns(a: string, b: string) {
  if (a === "Any intention" || b === "Any intention") return true;
  if (a === b) return true;
  const longTerm = new Set(["Long-term relationship", "Long-term, open to short", "Short-term, open to long"]);
  return longTerm.has(a) && longTerm.has(b);
}

export function getMatchInsight(
  profile: Profile,
  member: Member,
  preferences: Preferences,
): MatchInsight {
  const memberInterests = new Set([...member.interests, ...preferences.interests]);
  const shared = profile.interests.filter((interest) => memberInterests.has(interest));
  const uniqueShared = [...new Set(shared)];

  const interestScore = Math.min(42, uniqueShared.length * 12 + (uniqueShared.length ? 4 : 0));
  const intentionScore = intentionAligns(member.lookingFor, profile.lookingFor)
    ? profile.lookingFor === member.lookingFor
      ? 22
      : 17
    : 4;
  const distanceScore = Math.max(0, 18 * (1 - profile.distance / Math.max(preferences.maxDistance, 1)));
  const ageDistance = Math.abs(profile.age - member.age);
  const ageScore = Math.max(2, 10 - ageDistance * 0.8);
  const trustScore = profile.verified ? 4 : 1;
  const raw = interestScore + intentionScore + distanceScore + ageScore + trustScore + 4;
  const score = Math.max(46, Math.min(99, Math.round(raw)));

  const reasons: string[] = [];
  if (uniqueShared.length) {
    reasons.push(`${uniqueShared.length} shared ${uniqueShared.length === 1 ? "interest" : "interests"}`);
  } else {
    reasons.push("A chance to discover something new together");
  }
  if (intentionScore >= 17) reasons.push("Your relationship intentions align");
  if (profile.distance <= 5) reasons.push(`Only ${profile.distance.toFixed(1)} km away`);
  if (profile.verified) reasons.push("Photo verified");
  return { score, shared: uniqueShared, reasons: reasons.slice(0, 3) };
}

export function passesPreferences(profile: Profile, preferences: Preferences) {
  if (profile.age < preferences.minAge || profile.age > preferences.maxAge) return false;
  if (profile.distance > preferences.maxDistance) return false;
  if (preferences.verifiedOnly && !profile.verified) return false;
  if (!intentionAligns(profile.lookingFor, preferences.lookingFor)) return false;
  if (
    preferences.interests.length > 0 &&
    !profile.interests.some((interest) => preferences.interests.includes(interest))
  ) {
    return false;
  }
  return true;
}

export function conversationStarter(profile: Profile, member: Member) {
  const shared = profile.interests.find((interest) => member.interests.includes(interest));
  if (shared === "Cooking") return `What is the one meal you could cook for a first dinner party?`;
  if (shared === "Independent cinema") return `What film would you willingly watch again tonight?`;
  if (shared === "Art galleries") return `Which gallery would you take someone to on a first date?`;
  if (shared === "Travel slowly") return `Where did you travel that made you want to stay longer?`;
  if (shared) return `I noticed we both like ${shared.toLowerCase()}. What got you into it?`;
  return `Your answer about “${profile.promptQuestion.toLowerCase()}” caught my attention. What is the story behind it?`;
}
