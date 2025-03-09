import { FieldValue, Timestamp } from "firebase-admin/firestore";

export type ENVIRONMENT = "DEV" | "PROD";

/**
 * IncomingMail
 */
export type RawIncomingMail = {
  sender?: string;
  subject?: string;
  timestamp?: string;
  signature?: string;
  token?: string;
};

export type ParsedIncomingMail = {
  email: string;
  handle: string;
  timestamp: string;
  signature: string;
  token: string;
};

/**
 * Codeforces
 */
export type RawCodeforcesUser = {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  contribution: number;
  friendOfCount: number;
  lastOnlineTimeSeconds: number;
  registrationTimeSeconds: number;
  avatar: string;
  titlePhoto: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
};

export type CodeforcesUser = RawCodeforcesUser & {
  color: string;
};

export type CodeforcesApiSuccessResponse = {
  status: "OK";
  result: RawCodeforcesUser[];
};

export type CodeforcesApiFailureResponse = {
  status: "FAILED";
  comment: string;
};

export type RatingsResponse = {
  users: CodeforcesUser[];
  invalidHandles: string[];
};

/**
 * User
 */
export enum HandleState {
  UNKNOWN = "unknown",
  VALID = "valid",
  INVALID = "invalid"
}

export type UserBase = {
  email: string;
  handle: string;
  state: HandleState;
  data: CodeforcesUser | null;
};

export type AddUserArg = Pick<UserBase, "email" | "handle">;

export type UpdateUserArg = Partial<UserBase> & {
  id: string;
};

export type FirebaseWriteUser = UserBase & {
  created: FieldValue;
  lastUpdated: FieldValue;
};

export type FirebaseUpdateUser = Partial<UserBase> & {
  lastUpdated: FieldValue;
};

export type FirebaseReadUser = UserBase & {
  created: Timestamp;
  lastUpdated: Timestamp;
};

export type User = FirebaseReadUser & { id: string };

/**
 * Messages
 */
export enum MessageType {
  INVALID_HANDLE = "invalid_handle",
  RATING_CHANGE = "rating_change"
}

export enum MessageState {
  UNSENT = "unsent",
  SENT = "sent"
}

export type MessageData = {
  handle: string;
  rating?: number;
  ranking?: string;
  color?: string;
};

export type MessageBase = {
  type: MessageType;
  state: MessageState;
  email: string;
  data: MessageData;
};

export type AddMessageArg = Omit<MessageBase, "state">;

export type UpdateMessageArg = Partial<MessageBase> & {
  id: string;
};

export type FirebaseWriteMessage = MessageBase & {
  created: FieldValue;
  lastUpdated: FieldValue;
};

export type FirebaseReadMessage = MessageBase & {
  created: Timestamp;
  lastUpdated: Timestamp;
};

export type FirebaseUpdateMessage = Partial<MessageBase> & {
  lastUpdated: FieldValue;
};

export type Message = FirebaseReadMessage & {
  id: string;
};

/**
 * Analytics
 */
export enum AnalyticsType {
  USERS = "users",
  MESSAGES = "messages"
}

export type Analytics = {
  schemaVersion: 1;
  label: string;
  message: string;
};
