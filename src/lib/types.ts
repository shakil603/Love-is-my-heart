export type Profile = {
  id: string;
  name: string;
  age: number;
  gender: string;
  city: string;
  area: string;
  neighborhood: string;
  distance: number;
  occupation: string;
  bio: string;
  photo: string;
  photoAlt: string;
  photos: string[];
  interests: string[];
  languages: string[];
  lookingFor: string;
  promptQuestion: string;
  promptAnswer: string;
  idealSunday: string;
  verified: boolean;
  likesYou: boolean;
  newHere: boolean;
  isDemo: boolean;
  lastActive: string;
  height: string;
  education: string;
  drinking: string;
  smoking: string;
  workout: string;
  anthem: string;
};

export type Preferences = {
  id: string;
  minAge: number;
  maxAge: number;
  maxDistance: number;
  lookingFor: string;
  interests: string[];
  verifiedOnly: boolean;
};

export type Member = {
  id: string;
  email?: string;
  name: string;
  age: number;
  gender: string;
  city: string;
  area: string;
  bio: string;
  photo: string;
  photos: string[];
  lookingFor: string;
  interests: string[];
  occupation: string;
  languages: string[];
  promptQuestion: string;
  promptAnswer: string;
  idealSunday: string;
  height: string;
  education: string;
  drinking: string;
  smoking: string;
  workout: string;
  anthem: string;
  verified: boolean;
  isDemo: boolean;
  onboardingComplete: boolean;
  showOnline: boolean;
  readReceipts: boolean;
  notifications: boolean;
};

export type Message = {
  id: number;
  matchId: string;
  sender: "you" | "them" | "system";
  body: string;
  createdAt: string;
  readAt: string | null;
};

export type Match = {
  id: string;
  profileId: string;
  origin: string;
  unread: number;
  createdAt: string;
  lastMessageAt: string;
  profile: Profile;
  messages: Message[];
};

export type Interaction = {
  profileId: string;
  action: "like" | "pass" | "superlike";
  createdAt: string;
};

export type AppState = {
  profiles: Profile[];
  matches: Match[];
  interactions: Interaction[];
  preferences: Preferences;
  member: Member;
  demoMode: boolean;
  blockedProfileIds: string[];
};

export type View = "discover" | "matches" | "messages" | "profile";
export type DiscoveryAction = "like" | "pass" | "superlike";

export type City = {
  name: string;
  country: string;
  lat: number;
  lng: number;
};

export type SafetyReportReason =
  | "Fake profile or catfishing"
  | "Inappropriate messages"
  | "Harassment or hate speech"
  | "Spam or financial scam"
  | "Under 18"
  | "Something else";
