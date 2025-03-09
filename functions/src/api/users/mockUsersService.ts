import { AddUserArg, HandleState, UpdateUserArg, User } from "../../models";

export const createMockUsersService = () => ({
  fetchUserByEmail: jest.fn<Promise<User | null>, [string]>(),
  fetchUserByHandle: jest.fn<Promise<User[]>, [string]>(),
  registerUser: jest.fn<Promise<void>, [AddUserArg]>(),
  reRegisterUser: jest.fn<Promise<void>, [UpdateUserArg]>(),
  fetchUsersByHandleState: jest.fn<Promise<User[]>, [HandleState, number]>(),
  markAsInvalid: jest.fn<Promise<void>, [User[]]>(),
  markAsValid: jest.fn<Promise<void>, [User[]]>(),
  updateUsersData: jest.fn<Promise<void>, [User[]]>(),
  deleteUsers: jest.fn<Promise<void>, [string[]]>(),
  getUsersCount: jest.fn<Promise<number>, []>()
});
