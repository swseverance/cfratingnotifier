import { LoggerService } from "../../../api/logger/logger";
import { createMockLoggerService } from "../../../api/logger/mockLogger";
import { MailgunService } from "../../../api/mailgun/mailgunService";
import { createMockMailgunService } from "../../../api/mailgun/mockMailgunService";
import { MessagesService } from "../../../api/messages/messagesService";
import { createMockMessagesService } from "../../../api/messages/mockMessagesService";
import { MessageState, MessageType } from "../../../models";
import { testUtils } from "../../../test";
import { SendRatingChangeEmailsController } from "./sendRatingChangeEmails";

describe("SendRatingChangeEmailsController", () => {
  const messagesService = createMockMessagesService();
  const loggerService = createMockLoggerService();
  const mailgunService = createMockMailgunService();
  const controller = new SendRatingChangeEmailsController(
    messagesService as unknown as MessagesService,
    loggerService as unknown as LoggerService,
    mailgunService as unknown as MailgunService
  );

  beforeEach(() => jest.clearAllMocks());

  test("fetchMessages() error", async () => {
    const error = new Error("oh no!");
    messagesService.fetchMessages.mockRejectedValue(error);
    await controller.onSchedule();

    expect(loggerService.error).toHaveBeenCalled();
    expect(mailgunService.sendMessages).not.toHaveBeenCalled();
    expect(messagesService.markMessagesAsSent).not.toHaveBeenCalled();
  });

  test("no messages", async () => {
    messagesService.fetchMessages.mockResolvedValue([]);
    await controller.onSchedule();

    expect(mailgunService.sendMessages).not.toHaveBeenCalled();
    expect(messagesService.markMessagesAsSent).not.toHaveBeenCalled();
  });

  test("messages (complete success)", async () => {
    const messages = [
      testUtils.createMessage({
        id: "123",
        type: MessageType.RATING_CHANGE,
        state: MessageState.UNSENT
      }),
      testUtils.createMessage({
        id: "456",
        type: MessageType.RATING_CHANGE,
        state: MessageState.UNSENT
      })
    ];
    messagesService.fetchMessages.mockResolvedValue(messages);
    mailgunService.sendMessages.mockResolvedValue();
    messagesService.markMessagesAsSent.mockResolvedValue();
    await controller.onSchedule();

    expect(messagesService.fetchMessages).toHaveBeenCalledWith(
      MessageState.UNSENT,
      MessageType.RATING_CHANGE,
      controller.BATCH_SIZE
    );
    expect(mailgunService.sendMessages).toHaveBeenCalledWith(MessageType.RATING_CHANGE, messages);
    expect(messagesService.markMessagesAsSent).toHaveBeenCalledWith(messages);
  });

  test("sendMessages() error", async () => {
    const messages = [
      testUtils.createMessage({
        id: "123",
        type: MessageType.RATING_CHANGE,
        state: MessageState.UNSENT
      }),
      testUtils.createMessage({
        id: "456",
        type: MessageType.RATING_CHANGE,
        state: MessageState.UNSENT
      })
    ];
    messagesService.fetchMessages.mockResolvedValue(messages);
    mailgunService.sendMessages.mockRejectedValue(new Error("oh no!"));
    messagesService.markMessagesAsSent.mockResolvedValue();
    await controller.onSchedule();

    expect(loggerService.error).toHaveBeenCalled();
    expect(messagesService.markMessagesAsSent).not.toHaveBeenCalled();
  });

  test("markMessagesAsSent() error", async () => {
    const messages = [
      testUtils.createMessage({
        id: "123",
        type: MessageType.RATING_CHANGE,
        state: MessageState.UNSENT
      }),
      testUtils.createMessage({
        id: "456",
        type: MessageType.RATING_CHANGE,
        state: MessageState.UNSENT
      })
    ];
    messagesService.fetchMessages.mockResolvedValue(messages);
    mailgunService.sendMessages.mockResolvedValue();
    messagesService.markMessagesAsSent.mockRejectedValue(new Error("oh no!"));
    await controller.onSchedule();

    expect(loggerService.error).toHaveBeenCalled();
  });
});
