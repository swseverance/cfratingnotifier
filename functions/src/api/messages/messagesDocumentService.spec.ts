import { FieldValue } from "firebase-admin/firestore";
import { MessageData, MessageState, MessageType } from "../../models";
import { MessagesDocumentService } from "./messagesDocumentService";

jest.mock("firebase-admin/firestore", () => {
  return {
    FieldValue: {
      serverTimestamp: jest.fn(() => "mockTimestamp")
    }
  };
});

describe("MessagesDocumentService", () => {
  let service: MessagesDocumentService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = MessagesDocumentService.getInstance();
  });

  test("should return the same instance (singleton pattern)", () => {
    const instance1 = MessagesDocumentService.getInstance();
    const instance2 = MessagesDocumentService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test("createDocumentForNewMessage should return correct structure", () => {
    const result = service.createDocumentForNewMessage({
      email: "test@example.com",
      type: MessageType.RATING_CHANGE,
      data: { rating: 1000 } as MessageData
    });

    expect(result).toEqual({
      email: "test@example.com",
      type: MessageType.RATING_CHANGE,
      data: { rating: 1000 } as MessageData,
      state: MessageState.UNSENT,
      created: "mockTimestamp",
      lastUpdated: "mockTimestamp"
    });

    expect(FieldValue.serverTimestamp).toHaveBeenCalledTimes(1);
  });

  test("createChangesToExistingMessage should return correct changes object", () => {
    const result = service.createChangesToExistingMessage({
      state: MessageState.SENT,
      data: {
        rating: 1000
      } as MessageData
    });

    expect(result).toEqual({
      state: MessageState.SENT,
      data: { rating: 1000 },
      lastUpdated: "mockTimestamp"
    });

    expect(FieldValue.serverTimestamp).toHaveBeenCalledTimes(1);
  });

  test("createChangesToExistingMessage should omit undefined properties", () => {
    const result = service.createChangesToExistingMessage({
      hello: true
    } as any);

    expect(result).toEqual({
      lastUpdated: "mockTimestamp"
    });

    expect(FieldValue.serverTimestamp).toHaveBeenCalledTimes(1);
  });
});
