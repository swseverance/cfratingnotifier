import { MessagesService } from "../../api/messages/messagesService";
import { UsersService } from "../../api/users/usersService";
import { Analytics, AnalyticsType } from "../../models";

export class AnalyticsService {
  private static instance: AnalyticsService;

  static getInstance(): AnalyticsService {
    if (!this.instance) {
      this.instance = new AnalyticsService();
    }

    return this.instance;
  }

  constructor(
    private usersService = UsersService.getInstance(),
    private messagesService = MessagesService.getInstance()
  ) {}

  async getAnalytics(type: AnalyticsType): Promise<Analytics> {
    if (type === AnalyticsType.USERS) {
      return this.getUsers();
    } else if (type === AnalyticsType.MESSAGES) {
      return this.getMessages();
    } else {
      throw new Error(`unexpected analytics type "${type}"`);
    }
  }

  private async getUsers(): Promise<Analytics> {
    try {
      const count = await this.usersService.getUsersCount();

      return {
        schemaVersion: 1,
        label: "Active Users",
        message: `${count}`
      };
    } catch (error) {
      throw error;
    }
  }

  private async getMessages(): Promise<Analytics> {
    try {
      const count = await this.messagesService.getMessagesCount();

      return {
        schemaVersion: 1,
        label: "Rating Changes Sent",
        message: `${count}`
      };
    } catch (error) {
      throw error;
    }
  }
}
