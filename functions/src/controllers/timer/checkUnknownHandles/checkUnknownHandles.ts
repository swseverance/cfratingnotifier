import { CodeforcesService } from "../../../api/codeforces/codeforcesService";
import { LoggerService } from "../../../api/logger/logger";
import { UsersService } from "../../../api/users/usersService";
import { UtilsService } from "../../../api/utils/utilsService";
import { HandleState, RatingsResponse, User } from "../../../models";

/**
 * Overview:
 *
 * 1) Identify all users where user.state === HandleState.UNKNOWN. These users have recently
 *    registerd and we don't know if they used a valid handle or not
 * 2) We send a request to Codeforces to identify which of the users have invalid handles
 * 3) If some users have invalid handles we update user.state to HandleState.INVALID
 * 4) Otherwise, all users have valid handles so we update user.state to HandleState.VALID
 */
export class CheckUnknownHandlesController {
  private static instance: CheckUnknownHandlesController;

  readonly BATCH_SIZE = 50;

  static getInstance(): CheckUnknownHandlesController {
    if (!this.instance) {
      this.instance = new CheckUnknownHandlesController();
    }

    return this.instance;
  }

  constructor(
    private usersService = UsersService.getInstance(),
    private codeforcesService = CodeforcesService.getInstance(),
    private loggerService = LoggerService.getInstance(),
    private utilsService = UtilsService.getInstance()
  ) {}

  async onSchedule() {
    let users: User[];

    try {
      users = await this.usersService.fetchUsersByHandleState(HandleState.UNKNOWN, this.BATCH_SIZE);
    } catch (error) {
      this.loggerService.error("fetchUsersByHandleState() error", error as Error);

      return;
    }

    if (!users.length) {
      return;
    }

    let response: RatingsResponse;

    try {
      response = await this.codeforcesService.fetchRatings(users.map(({ handle }) => handle));
    } catch (error) {
      this.loggerService.error("fetchRatings() error", error as Error);

      return;
    }

    if (response.invalidHandles.length) {
      try {
        const usersWithInvalidHandles = this.utilsService.identifyUsersWithInvalidHandles(
          users,
          response.invalidHandles
        );

        await this.usersService.markAsInvalid(usersWithInvalidHandles);
      } catch (error) {
        this.loggerService.error("markAsInvalid() error", error as Error);

        return;
      }
    } else {
      try {
        await this.usersService.markAsValid(users);
      } catch (error) {
        this.loggerService.error("markAsValid() error", error as Error);

        return;
      }
    }
  }
}
