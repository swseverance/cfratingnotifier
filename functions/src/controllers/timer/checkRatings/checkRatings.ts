import { CodeforcesService } from "../../../api/codeforces/codeforcesService";
import { LoggerService } from "../../../api/logger/logger";
import { MessagesService } from "../../../api/messages/messagesService";
import { UsersService } from "../../../api/users/usersService";
import { UtilsService } from "../../../api/utils/utilsService";
import { HandleState, RatingsResponse, User } from "../../../models";

/**
 * Overview:
 *
 * 1) Looks for users with state = HandleState.VALID (treating them as a queue)
 * 2) Fetches ratings from Codeforces
 * 3) If any invalid handles are identified those users are updated so that
 *    user.state = HandleState.INVALID and the process terminates
 * 4) If any ratings have changed then rating change messages are created
 * 5) Fetched users are updated (regardless of whether their rating has changed)
 *    so they go to the back of the queue
 */
export class CheckRatingsController {
  private static instance: CheckRatingsController;

  readonly BATCH_SIZE = 50;

  static getInstance(): CheckRatingsController {
    if (!this.instance) {
      this.instance = new CheckRatingsController();
    }

    return this.instance;
  }

  constructor(
    private codeforcesService = CodeforcesService.getInstance(),
    private usersService = UsersService.getInstance(),
    private loggerService = LoggerService.getInstance(),
    private utilsService = UtilsService.getInstance(),
    private messagesService = MessagesService.getInstance()
  ) {}

  async onSchedule() {
    let users: User[] = [];

    try {
      users = await this.usersService.fetchUsersByHandleState(HandleState.VALID, this.BATCH_SIZE);
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
      /**
       * this could perhaps happen if a user deletes their Codeforces
       * account after registering with cfratingnotifier
       */
      try {
        const usersWithInvalidHandles = this.utilsService.identifyUsersWithInvalidHandles(
          users,
          response.invalidHandles
        );

        await this.usersService.markAsInvalid(usersWithInvalidHandles);
      } catch (error) {
        this.loggerService.error("markAsInvalid() error", error as Error);
      }

      return;
    }

    const { changed, unchanged } = this.utilsService.identifyUserChanges(users, response.users);

    if (changed.length) {
      try {
        await this.messagesService.createRatingChangeMessages(changed);
      } catch (error) {
        this.loggerService.error("createRatingChangeMessages() error", error as Error);

        return;
      }
    }

    try {
      /**
       * we update the data property of each user with the information received
       * from Codeforces even if the rating has not changed. this is so that the
       * lastUpdated timestamp on each document will be updated and they will be
       * sent to the back of the queue. otherwise we'd be polling for the same
       * set of users pretty much all the time
       */
      await this.usersService.updateUsersData([...changed, ...unchanged]);
    } catch (error) {
      this.loggerService.error("updateUsersData()", error as Error);

      return;
    }
  }
}
