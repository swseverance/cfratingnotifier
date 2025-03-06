import { LoggerService } from "../../../api/logger/logger";
import { MailgunService } from "../../../api/mailgun/mailgunService";
import { MessagesService } from "../../../api/messages/messagesService";
import { Message, MessageState, MessageType } from "../../../models";

/**
 * Overview:
 *
 * 1) Identifies unsent invalid handle messages
 * 2) Sends the messages
 * 3) Marks them as sent
 */
export class SendInvalidHandleEmailsController {
  private static instance: SendInvalidHandleEmailsController;

  readonly BATCH_SIZE = 50;

  static getInstance(): SendInvalidHandleEmailsController {
    if (!this.instance) {
      this.instance = new SendInvalidHandleEmailsController();
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
        MessageType.INVALID_HANDLE,
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
      await this.mailgunService.sendMessages(MessageType.INVALID_HANDLE, messages);
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
