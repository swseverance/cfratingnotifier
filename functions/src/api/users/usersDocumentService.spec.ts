import { FieldValue } from "firebase-admin/firestore";
import { CodeforcesUser, HandleState } from "../../models";
import { UsersDocumentService } from "./usersDocumentService";

jest.mock("firebase-admin/firestore", () => {
  return {
    FieldValue: {
      serverTimestamp: jest.fn(() => "mockTimestamp")
    }
  };
});

describe("UsersDocumentService", () => {
  let service: UsersDocumentService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = UsersDocumentService.getInstance();
  });

  test("should return the same instance (singleton pattern)", () => {
    const instance1 = UsersDocumentService.getInstance();
    const instance2 = UsersDocumentService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test("createDocumentForNewUser should return correct structure", () => {
    const result = service.createDocumentForNewUser({
      email: "test@example.com",
      handle: "testHandle"
    });

    expect(result).toEqual({
      email: "test@example.com",
      handle: "testHandle",
      data: null,
      state: HandleState.UNKNOWN,
      created: "mockTimestamp",
      lastUpdated: "mockTimestamp"
    });

    expect(FieldValue.serverTimestamp).toHaveBeenCalledTimes(1);
  });

  test("createChangesToExistingUser should return correct changes object", () => {
    const result = service.createChangesToExistingUser({
      handle: "tourist",
      state: HandleState.VALID,
      data: { handle: "tourist", rating: 10000 } as CodeforcesUser
    });

    expect(result).toEqual({
      handle: "tourist",
      state: HandleState.VALID,
      data: { handle: "tourist", rating: 10000 },
      lastUpdated: "mockTimestamp"
    });

    expect(FieldValue.serverTimestamp).toHaveBeenCalledTimes(1);
  });

  test("createChangesToExistingUser should omit undefined properties", () => {
    const result = service.createChangesToExistingUser({
      hello: true
    } as any);

    expect(result).toEqual({
      lastUpdated: "mockTimestamp"
    });

    expect(FieldValue.serverTimestamp).toHaveBeenCalledTimes(1);
  });
});
