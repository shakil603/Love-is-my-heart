export type Profile = {
  id: string;
  name: string;
  age: number;
  gender: string;
  city: string;
  neighborhood: string;
  distance: number;
  occupation: string;
  bio: string;
  photo: string;
  photoAlt: string;
  interests: string[];
  languages: string[];
  lookingFor: string;
  promptQuestion: string;
  promptAnswer: string;
  idealSunday: string;
  verified: boolean;
  likesYou: boolean;
  newHere: boolean;
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
  name: string;
  age: number;
  city: string;
  bio: string;
  photo: string;
  lookingFor: string;
  interests: string[];
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
};

export type View = "discover" | "matches" | "messages" | "profile";
export type DiscoveryAction = "like" | "pass" | "superlike";
