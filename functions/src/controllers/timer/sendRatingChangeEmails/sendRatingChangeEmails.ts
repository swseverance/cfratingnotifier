import { LoggerService } from "../../../api/logger/logger";
import { MailgunService } from "../../../api/mailgun/mailgunService";
import { MessagesService } from "../../../api/messages/messagesService";
import { Message, MessageState, MessageType } from "../../../models";

/**
 * Overview:
 *
 * 1) Identifies unsent rating change messages
 * 2) Sends the messages
 * 3) Marks them as sent
 */
export class SendRatingChangeEmailsController {
  private static instance: SendRatingChangeEmailsController;

  readonly BATCH_SIZE = 50;

  static getInstance(): SendRatingChangeEmailsController {
    if (!this.instance) {
      this.instance = new SendRatingChangeEmailsController();
    }

    return this.instance;
  }

  constructor(
    private messagesService = MessagesService.getInstance(),
    private loggerService = LoggerService.getInstance(),
    private mailgunService = MailgunService.getInstance()
  ) {}

  async onSchedule() {
    let messages: Message[];

    try {
      messages = await this.messagesService.fetchMessages(
        MessageState.UNSENT,
        MessageType.RATING_CHANGE,
        this.BATCH_SIZE
      );
    } catch (error) {
      this.loggerService.error("fetchMessages() error", error as Error);

      return;
    }

    if (!messages.length) {
      return;
    }

    try {
      await this.mailgunService.sendMessages(MessageType.RATING_CHANGE, messages);
    } catch (error) {
      this.loggerService.error("sendMessages() error", error as Error);

      return;
    }

    try {
      await this.messagesService.markMessagesAsSent(messages);
    } catch (error) {
      this.loggerService.error("markMessagesAsSent() error", error as Error);

      return;
    }
  }
}
