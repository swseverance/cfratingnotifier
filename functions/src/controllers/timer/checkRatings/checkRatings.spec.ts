import { CodeforcesService } from "../../../api/codeforces/codeforcesService";
import { createMockCodeforces } from "../../../api/codeforces/mockCodeforcesService";
import { LoggerService } from "../../../api/logger/logger";
import { createMockLoggerService } from "../../../api/logger/mockLogger";
import { MessagesService } from "../../../api/messages/messagesService";
import { createMockMessagesService } from "../../../api/messages/mockMessagesService";
import { createMockUsersService } from "../../../api/users/mockUsersService";
import { UsersService } from "../../../api/users/usersService";
import { createMockUtilsService } from "../../../api/utils/mockUtilsService";
import { UtilsService } from "../../../api/utils/utilsService";
import { HandleState } from "../../../models";
import { testUtils } from "../../../test";
import { CheckRatingsController } from "./checkRatings";

describe("CheckRatingsController", () => {
  const codeforcesService = createMockCodeforces();
  const usersService = createMockUsersService();
  const loggerService = createMockLoggerService();
  const utilsService = createMockUtilsService();
  const messagesService = createMockMessagesService();
  const controller = new CheckRatingsController(
    codeforcesService as unknown as CodeforcesService,
    usersService as unknown as UsersService,
    loggerService as unknown as LoggerService,
    utilsService as unknown as UtilsService,
    messagesService as unknown as MessagesService
  );

  beforeEach(() => jest.clearAllMocks());

  test("fetchUsersByHandleState() error", async () => {
    usersService.fetchUsersByHandleState.mockRejectedValue(new Error("oh no!"));
    await controller.onSchedule();

    expect(usersService.fetchUsersByHandleState).toHaveBeenCalledWith(
      HandleState.VALID,
      controller.BATCH_SIZE
    );
    expect(loggerService.error).toHaveBeenCalled();
    expect(codeforcesService.fetchRatings).not.toHaveBeenCalled();
    expect(usersService.markAsInvalid).not.toHaveBeenCalled();
    expect(usersService.updateUsersData).not.toHaveBeenCalled();
    expect(messagesService.createRatingChangeMessages).not.toHaveBeenCalled();
  });

  test("no users", async () => {
    usersService.fetchUsersByHandleState.mockResolvedValue([]);
    await controller.onSchedule();

    expect(usersService.fetchUsersByHandleState).toHaveBeenCalledWith(
      HandleState.VALID,
      controller.BATCH_SIZE
    );
    expect(codeforcesService.fetchRatings).not.toHaveBeenCalled();
    expect(usersService.markAsInvalid).not.toHaveBeenCalled();
    expect(usersService.updateUsersData).not.toHaveBeenCalled();
    expect(messagesService.createRatingChangeMessages).not.toHaveBeenCalled();
  });

  test("fetchRatings() error", async () => {
    const bobUser = testUtils.createUser({
      id: "123",
      email: "bob@example.com",
      handle: "bob",
      rating: 1000,
      rank: "newbie",
      color: "gray"
    });
    const johnUser = testUtils.createUser({
      id: "456",
      email: "john@example.com",
      handle: "john",
      rating: 1000,
      rank: "newbie",
      color: "gray"
    });
    usersService.fetchUsersByHandleState.mockResolvedValue([bobUser, johnUser]);
    codeforcesService.fetchRatings.mockRejectedValue(new Error("oh no!"));
    await controller.onSchedule();

    expect(loggerService.error).toHaveBeenCalled();
    expect(codeforcesService.fetchRatings).toHaveBeenCalledWith([bobUser.handle, johnUser.handle]);
    expect(usersService.markAsInvalid).not.toHaveBeenCalled();
    expect(usersService.updateUsersData).not.toHaveBeenCalled();
    expect(messagesService.createRatingChangeMessages).not.toHaveBeenCalled();
  });

  test("invalid handles", async () => {
    const bobUser = testUtils.createUser({
      id: "123",
      email: "bob@example.com",
      handle: "bob",
      rating: 1000,
      rank: "newbie",
      color: "gray"
    });
    const johnUser = testUtils.createUser({
      id: "456",
      email: "john@example.com",
      handle: "john",
      rating: 1000,
      rank: "newbie",
      color: "gray"
    });
    usersService.fetchUsersByHandleState.mockResolvedValue([bobUser, johnUser]);
    codeforcesService.fetchRatings.mockResolvedValue({
      users: [],
      invalidHandles: [johnUser.handle]
    });
    await controller.onSchedule();

    expect(usersService.markAsInvalid).toHaveBeenCalledWith([johnUser]);
    expect(usersService.updateUsersData).not.toHaveBeenCalled();
    expect(messagesService.createRatingChangeMessages).not.toHaveBeenCalled();
  });

  test("markAsInvalid() error", async () => {
    const bobUser = testUtils.createUser({
      id: "123",
      email: "bob@example.com",
      handle: "bob",
      rating: 1000,
      rank: "newbie",
      color: "gray"
    });
    const johnUser = testUtils.createUser({
      id: "456",
      email: "john@example.com",
      handle: "john",
      rating: 1000,
      rank: "newbie",
      color: "gray"
    });
    usersService.fetchUsersByHandleState.mockResolvedValue([bobUser, johnUser]);
    codeforcesService.fetchRatings.mockResolvedValue({
      users: [],
      invalidHandles: [johnUser.handle]
    });
    usersService.markAsInvalid.mockRejectedValue(new Error("oh no!"));
    await controller.onSchedule();

    expect(usersService.markAsInvalid).toHaveBeenCalledWith([johnUser]);
    expect(loggerService.error).toHaveBeenCalled();
    expect(usersService.updateUsersData).not.toHaveBeenCalled();
    expect(messagesService.createRatingChangeMessages).not.toHaveBeenCalled();
  });

  test("ratings change", async () => {
    const bobUser = testUtils.createUser({
      id: "123",
      email: "bob@example.com",
      handle: "bob",
      rating: 1000,
      rank: "newbie",
      color: "gray"
    });
    const johnUser = testUtils.createUser({
      id: "456",
      email: "john@exmaple.com",
      handle: "john",
      rating: 1000,
      rank: "newbie",
      color: "gray"
    });
    const bobCodeforcesUser = testUtils.createCodeforcesUser({
      handle: "bob",
      rating: 1000,
      rank: "newbie",
      color: "gray"
    });
    const johnCodeforcesUser = testUtils.createCodeforcesUser({
      handle: "john",
      rating: 1250,
      rank: "pupil",
      color: "green"
    });
    usersService.fetchUsersByHandleState.mockResolvedValue([bobUser, johnUser]);
    codeforcesService.fetchRatings.mockResolvedValue({
      users: [bobCodeforcesUser, johnCodeforcesUser],
      invalidHandles: []
    });
    await controller.onSchedule();

    expect(usersService.markAsInvalid).not.toHaveBeenCalled();
    expect(messagesService.createRatingChangeMessages).toHaveBeenCalledWith([
      {
        ...johnUser,
        data: johnCodeforcesUser
      }
    ]);
    expect(usersService.updateUsersData).toHaveBeenCalledWith([
      {
        ...johnUser,
        data: johnCodeforcesUser
      },
      {
        ...bobUser,
        data: bobCodeforcesUser
      }
    ]);
  });

  test("createRatingChangeMessages() error", async () => {
    const bobUser = testUtils.createUser({
      id: "123",
      email: "bob@example.com",
      handle: "bob",
      rating: 1000,
      rank: "newbie",
      color: "gray"
    });
    const johnUser = testUtils.createUser({
      id: "456",
      email: "john@exmaple.com",
      handle: "john",
      rating: 1000,
      rank: "newbie",
      color: "gray"
    });
    const bobCodeforcesUser = testUtils.createCodeforcesUser({
      handle: "bob",
      rating: 1000,
      rank: "newbie",
      color: "gray"
    });
    const johnCodeforcesUser = testUtils.createCodeforcesUser({
      handle: "john",
      rating: 1250,
      rank: "pupil",
      color: "green"
    });
    usersService.fetchUsersByHandleState.mockResolvedValue([bobUser, johnUser]);
    codeforcesService.fetchRatings.mockResolvedValue({
      users: [bobCodeforcesUser, johnCodeforcesUser],
      invalidHandles: []
    });
    messagesService.createRatingChangeMessages.mockRejectedValue(new Error("oh no!"));
    await controller.onSchedule();

    expect(loggerService.error).toHaveBeenCalled();
    expect(usersService.markAsInvalid).not.toHaveBeenCalled();
    expect(messagesService.createRatingChangeMessages).toHaveBeenCalledWith([
      {
        ...johnUser,
        data: johnCodeforcesUser
      }
    ]);
    expect(usersService.updateUsersData).not.toHaveBeenCalled();
  });

  test("updateUsersData() error", async () => {
    const bobUser = testUtils.createUser({
      id: "123",
      email: "bob@example.com",
      handle: "bob",
      rating: 1000,
      rank: "newbie",
      color: "gray"
    });
    const johnUser = testUtils.createUser({
      id: "456",
      email: "john@exmaple.com",
      handle: "john",
      rating: 1000,
      rank: "newbie",
      color: "gray"
    });
    const bobCodeforcesUser = testUtils.createCodeforcesUser({
      handle: "bob",
      rating: 1000,
      rank: "newbie",
      color: "gray"
    });
    const johnCodeforcesUser = testUtils.createCodeforcesUser({
      handle: "john",
      rating: 1250,
      rank: "pupil",
      color: "green"
    });
    usersService.fetchUsersByHandleState.mockResolvedValue([bobUser, johnUser]);
    codeforcesService.fetchRatings.mockResolvedValue({
      users: [bobCodeforcesUser, johnCodeforcesUser],
      invalidHandles: []
    });
    usersService.updateUsersData.mockRejectedValue(new Error("oh no!"));
    await controller.onSchedule();

    expect(loggerService.error).toHaveBeenCalled();
  });
});
