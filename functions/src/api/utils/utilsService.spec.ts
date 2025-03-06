import { CodeforcesUser, User } from "../../models";
import { testUtils } from "../../test";
import { ConfigService } from "../config/configService";
import { createMockConfigService } from "../config/mockConfigService";
import { LoggerService } from "../logger/logger";
import { createMockLoggerService } from "../logger/mockLogger";
import { UtilsService } from "./utilsService";

describe("UtilsService", () => {
  test("toString()", () => {
    const service = new UtilsService(
      createMockConfigService() as ConfigService,
      createMockLoggerService() as LoggerService
    );

    expect(service.toString(" a ")).toBe("a");
    expect(service.toString("abc")).toBe("abc");
    expect(service.toString(undefined)).toBe("");
    expect(service.toString(null as any)).toBe("");
  });

  describe("isAuthenticated()", () => {
    it("true", () => {
      const service = new UtilsService(
        createMockConfigService({ AUTH_TOKEN: "123" }) as ConfigService,
        createMockLoggerService() as LoggerService
      );
      const actual = service.isAuthenticated({
        authorization: "Basic 123"
      });

      expect(actual).toBe(true);
    });

    it("false", () => {
      const service = new UtilsService(
        createMockConfigService({ AUTH_TOKEN: "123" }) as ConfigService,
        createMockLoggerService() as LoggerService
      );
      const actual = service.isAuthenticated({
        authorization: "Basic 456"
      });

      expect(actual).toBe(false);
    });
  });

  describe("identifyUsersWithInvalidHandles()", () => {
    it("some invalid", () => {
      const service = new UtilsService(
        createMockConfigService() as ConfigService,
        createMockLoggerService() as LoggerService
      );
      const bobUser = testUtils.createUser({
        id: "123",
        handle: "bob",
        email: "bob@example.com",
        rank: "newbie",
        rating: 1000,
        color: "gray"
      });
      const johnUser = testUtils.createUser({
        id: "456",
        handle: "john",
        email: "john@example.com",
        rank: "newbie",
        rating: 1100,
        color: "gray"
      });
      const users: User[] = [bobUser, johnUser];
      const actual = service.identifyUsersWithInvalidHandles(users, [johnUser.handle]);
      const expected: User[] = [johnUser];

      expect(actual).toEqual(expected);
    });

    it("no invalid", () => {
      const service = new UtilsService(
        createMockConfigService() as ConfigService,
        createMockLoggerService() as LoggerService
      );
      const bobUser = testUtils.createUser({
        id: "123",
        handle: "bob",
        email: "bob@example.com",
        rank: "newbie",
        rating: 1000,
        color: "gray"
      });
      const johnUser = testUtils.createUser({
        id: "456",
        handle: "john",
        email: "john@example.com",
        rank: "newbie",
        rating: 1100,
        color: "gray"
      });
      const users: User[] = [bobUser, johnUser];
      const actual = service.identifyUsersWithInvalidHandles(users, []);
      const expected: User[] = [];

      expect(actual).toEqual(expected);
    });
  });

  describe("identifyUserChanges()", () => {
    it("some changes", () => {
      const service = new UtilsService(
        createMockConfigService() as ConfigService,
        createMockLoggerService() as LoggerService
      );
      const bobUser = testUtils.createUser({
        id: "123",
        handle: "bob",
        email: "bob@example.com",
        rank: "newbie",
        rating: 1000,
        color: "gray"
      });
      const johnUser = testUtils.createUser({
        id: "456",
        handle: "john",
        email: "john@example.com",
        rank: "newbie",
        rating: 1100,
        color: "gray"
      });
      const users: User[] = [bobUser, johnUser];
      const bobCodeforcesUser = testUtils.createCodeforcesUser({
        handle: "bob",
        rank: "newbie",
        rating: 1000,
        color: "gray"
      });
      const johnCodeforcesUser = testUtils.createCodeforcesUser({
        handle: "john",
        rank: "pupil",
        rating: 1250,
        color: "green"
      });
      const codeforcesUsers: CodeforcesUser[] = [bobCodeforcesUser, johnCodeforcesUser];
      const actual = service.identifyUserChanges(users, codeforcesUsers);
      const expectedChanged: User[] = [
        {
          ...johnUser,
          data: johnCodeforcesUser
        }
      ];
      const expectedUnchanged: User[] = [
        {
          ...bobUser,
          data: bobCodeforcesUser
        }
      ];

      expect(actual.changed).toEqual(expectedChanged);
      expect(actual.unchanged).toEqual(expectedUnchanged);
    });

    it("no changes", () => {
      const service = new UtilsService(
        createMockConfigService() as ConfigService,
        createMockLoggerService() as LoggerService
      );
      const bobUser = testUtils.createUser({
        id: "123",
        handle: "bob",
        email: "bob@example.com",
        rank: "newbie",
        rating: 1000,
        color: "gray"
      });
      const johnUser = testUtils.createUser({
        id: "456",
        handle: "john",
        email: "john@example.com",
        rank: "newbie",
        rating: 1100,
        color: "gray"
      });
      const users: User[] = [bobUser, johnUser];
      const bobCodeforcesUser = testUtils.createCodeforcesUser({
        handle: "bob",
        rank: "newbie",
        rating: 1000,
        color: "gray"
      });
      const johnCodeforcesUser = testUtils.createCodeforcesUser({
        handle: "john",
        rank: "newbie",
        rating: 1100,
        color: "gray"
      });
      const codeforcesUsers: CodeforcesUser[] = [bobCodeforcesUser, johnCodeforcesUser];
      const actual = service.identifyUserChanges(users, codeforcesUsers);
      const expectedChanged: User[] = [];
      const expectedUnchanged: User[] = [
        {
          ...bobUser,
          data: bobCodeforcesUser
        },
        {
          ...johnUser,
          data: johnCodeforcesUser
        }
      ];

      expect(actual.changed).toEqual(expectedChanged);
      expect(actual.unchanged).toEqual(expectedUnchanged);
    });

    it("first rating for user", () => {
      const service = new UtilsService(
        createMockConfigService() as ConfigService,
        createMockLoggerService() as LoggerService
      );
      const bobUser = {
        id: "123",
        handle: "bob",
        email: "bob@example.com",
        data: null
      } as User;
      const users: User[] = [bobUser];
      const bobCodeforcesUser = testUtils.createCodeforcesUser({
        handle: "bob",
        rank: "newbie",
        rating: 1000,
        color: "gray"
      });
      const codeforcesUsers: CodeforcesUser[] = [bobCodeforcesUser];
      const actual = service.identifyUserChanges(users, codeforcesUsers);
      const expectedChanged: any = [
        {
          ...bobUser,
          data: bobCodeforcesUser
        }
      ];
      const expectedUnchanged: any = [];

      expect(actual.changed).toEqual(expectedChanged);
      expect(actual.unchanged).toEqual(expectedUnchanged);
    });
  });
});
