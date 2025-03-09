import { IncomingHttpHeaders } from "http";
import { CodeforcesUser, User } from "../../models";
import { ConfigService } from "../config/configService";
import { createMockConfigService } from "../config/mockConfigService";
import { LoggerService } from "../logger/logger";
import { createMockLoggerService } from "../logger/mockLogger";
import { UtilsService } from "./utilsService";

export const createMockUtilsService = () => {
  const service = new UtilsService(
    createMockConfigService() as ConfigService,
    createMockLoggerService() as LoggerService
  );

  return {
    toString: jest.fn<string, [string?]>((str?: string) => service.toString(str)),
    isAuthenticated: jest.fn<boolean, [IncomingHttpHeaders]>(),
    identifyUsersWithInvalidHandles: jest.fn<User[], [User[], string[]]>(
      (users: User[], invalidHandles: string[]) =>
        service.identifyUsersWithInvalidHandles(users, invalidHandles)
    ),
    identifyUserChanges: jest.fn<
      {
        changed: User[];
        unchanged: User[];
      },
      [User[], CodeforcesUser[]]
    >((users: User[], codeforcesUsers: CodeforcesUser[]) =>
      service.identifyUserChanges(users, codeforcesUsers)
    )
  };
};
