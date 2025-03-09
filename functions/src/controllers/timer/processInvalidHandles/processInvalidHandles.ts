import { LoggerService } from "../../../api/logger/logger";
import { MessagesService } from "../../../api/messages/messagesService";
import { UsersService } from "../../../api/users/usersService";
import { HandleState, User } from "../../../models";

/**
 * Overview:
 *
 * 1) identifies users with state = HandleState.INVALID
 * 2) creates invalid handle messages
 * 3) drops the users with invalid handles
 */
export class ProcessInvalidHandlesController {
  private static instance: ProcessInvalidHandlesController;

  readonly BATCH_SIZE = 50;

  static getInstance(): ProcessInvalidHandlesController {
    if (!this.instance) {
      this.instance = new ProcessInvalidHandlesController();
    }

    return this.instance;
  }

  constructor(
    private usersService = UsersService.getInstance(),
    private messagesService = MessagesService.getInstance(),
    private loggerService = LoggerService.getInstance()
  ) {}

  async onSchedule() {
    let users: User[] = [];

    try {
      users = await this.usersService.fetchUsersByHandleState(HandleState.INVALID, this.BATCH_SIZE);
    } catch (error) {
      this.loggerService.error("fetchUsersByHandleState() error", error as Error);

      return;
    }

    if (!users.length) {
      return;
    }

    try {
      await this.messagesService.createInvalidHandleMessages(users);
    } catch (error) {
      this.loggerService.error("createInvalidHandleMessages() error", error as Error);

      return;
    }

    try {
      await this.usersService.deleteUsers(users);
    } catch (error) {
      this.loggerService.error("deleteUsers() error", error as Error);

      return;
    }
  }
}
