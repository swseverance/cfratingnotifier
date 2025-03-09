import { CodeforcesUser, Message, MessageState, MessageType, User } from "../models";

export const createCodeforcesUser = ({
  handle,
  rating,
  rank,
  color
}: {
  handle: string;
  rating: number;
  rank: string;
  color: string;
}): CodeforcesUser => {
  const codeforcesUser: Partial<CodeforcesUser> = {
    handle,
    rating,
    rank,
    color
  };

  return codeforcesUser as CodeforcesUser;
};

export const createUser = ({
  id,
  email,
  handle,
  rating,
  rank,
  color
}: {
  id: string;
  email: string;
  handle: string;
  rating: number;
  rank: string;
  color: string;
}): User => {
  const user: Partial<User> = {
    id,
    email,
    handle,
    data: createCodeforcesUser({ handle, rating, rank, color })
  };

  return user as User;
};

export const createMessage = ({
  id,
  type,
  state
}: {
  id: string;
  type: MessageType;
  state: MessageState;
}): Message =>
  ({
    id,
    type,
    state
  }) as Message;

export const testUtils = {
  createUser,
  createCodeforcesUser,
  createMessage
};
