import { IncomingHttpHeaders } from "http";
import { CodeforcesUser, User } from "../../models";
import { ConfigService } from "../config/configService";
import { LoggerService } from "../logger/logger";

export class UtilsService {
  private static instance: UtilsService;

  static getInstance(): UtilsService {
    if (!this.instance) {
      this.instance = new UtilsService();
    }

    return this.instance;
  }

  constructor(
    private configService = ConfigService.getInstance(),
    private loggerService = LoggerService.getInstance()
  ) {}

  toString(str?: string): string {
    return (typeof str === "string" ? str : "").trim();
  }

  isAuthenticated(headers: IncomingHttpHeaders) {
    return headers["authorization"] === `Basic ${this.configService.AUTH_TOKEN}`;
  }

  identifyUsersWithInvalidHandles(users: User[], invalidHandles: string[]) {
    return users.filter(({ handle }) => invalidHandles.includes(handle));
  }

  identifyUserChanges(
    users: User[],
    codeforcesUsers: CodeforcesUser[]
  ): {
    changed: User[];
    unchanged: User[];
  } {
    const changed: User[] = [];
    const unchanged: User[] = [];

    for (const user of users) {
      const codeforcesUser = codeforcesUsers.find(({ handle }) => handle === user.handle);

      if (!codeforcesUser) {
        this.loggerService.warn(
          "this should never happen. we asked Codeforces for info on a user and it was not provided in the response even though the response was a success",
          {
            users,
            codeforcesUsers
          }
        );

        unchanged.push(user);
      } else {
        if (user.data?.rating !== codeforcesUser.rating) {
          changed.push({
            ...user,
            data: codeforcesUser
          });
        } else {
          unchanged.push(user);
        }
      }
    }

    return {
      changed,
      unchanged
    };
  }
}
