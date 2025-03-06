import { AddMessageArg, Message, MessageState, MessageType } from "../../models";

export const createMockMessagesService = () => ({
  createInvalidHandleMessages: jest.fn<Promise<void>, [AddMessageArg]>(),
  createRatingChangeMessages: jest.fn<Promise<void>, [AddMessageArg]>(),
  markMessagesAsSent: jest.fn<Promise<void>, [Message[]]>(),
  fetchMessages: jest.fn<Promise<Message[]>, [MessageState, MessageType, number]>(),
  fetchMessagesByHandle: jest.fn<Promise<Message[]>, [string]>(),
  getMessagesCount: jest.fn<Promise<number>, []>()
});
