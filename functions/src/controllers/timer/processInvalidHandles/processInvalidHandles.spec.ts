import { LoggerService } from "../../../api/logger/logger";
import { createMockLoggerService } from "../../../api/logger/mockLogger";
import { MessagesService } from "../../../api/messages/messagesService";
import { createMockMessagesService } from "../../../api/messages/mockMessagesService";
import { createMockUsersService } from "../../../api/users/mockUsersService";
import { UsersService } from "../../../api/users/usersService";
import { HandleState } from "../../../models";
import { testUtils } from "../../../test";
import { ProcessInvalidHandlesController } from "./processInvalidHandles";

describe("ProcessInvalidHandlesController", () => {
  const messagesService = createMockMessagesService();
  const loggerService = createMockLoggerService();
  const usersService = createMockUsersService();
  const controller = new ProcessInvalidHandlesController(
    usersService as unknown as UsersService,
    messagesService as unknown as MessagesService,
    loggerService as unknown as LoggerService
  );

  beforeEach(() => jest.clearAllMocks());

  test("fetchUsersByHandleState() error", async () => {
    const error = new Error("oh no!");
    usersService.fetchUsersByHandleState.mockRejectedValue(error);
    await controller.onSchedule();

    expect(loggerService.error).toHaveBeenCalled();
    expect(messagesService.createInvalidHandleMessages).not.toHaveBeenCalled();
    expect(usersService.deleteUsers).not.toHaveBeenCalled();
  });

  test("no users", async () => {
    usersService.fetchUsersByHandleState.mockResolvedValue([]);
    await controller.onSchedule();

    expect(messagesService.createInvalidHandleMessages).not.toHaveBeenCalled();
    expect(usersService.deleteUsers).not.toHaveBeenCalled();
  });

  test("success", async () => {
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
    const users = [bobUser, johnUser];
    usersService.fetchUsersByHandleState.mockResolvedValue(users);
    await controller.onSchedule();

    expect(usersService.fetchUsersByHandleState).toHaveBeenCalledWith(
      HandleState.INVALID,
      controller.BATCH_SIZE
    );
    expect(messagesService.createInvalidHandleMessages).toHaveBeenCalledWith(users);
    expect(usersService.deleteUsers).toHaveBeenCalledWith(users);
  });

  test("createInvalidHandleMessages() error", async () => {
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
    const users = [bobUser, johnUser];
    usersService.fetchUsersByHandleState.mockResolvedValue(users);
    messagesService.createInvalidHandleMessages.mockRejectedValue(new Error("oh no!"));
    await controller.onSchedule();

    expect(loggerService.error).toHaveBeenCalled();
    expect(messagesService.createInvalidHandleMessages).toHaveBeenCalledWith(users);
    expect(usersService.deleteUsers).not.toHaveBeenCalled();
  });

  test("deleteUsers() error", async () => {
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
    const users = [bobUser, johnUser];
    usersService.fetchUsersByHandleState.mockResolvedValue(users);
    usersService.deleteUsers.mockRejectedValue(new Error("oh no!"));
    await controller.onSchedule();

    expect(loggerService.error).toHaveBeenCalled();
  });
});
