import { CodeforcesService } from "../../../api/codeforces/codeforcesService";
import { createMockCodeforces } from "../../../api/codeforces/mockCodeforcesService";
import { LoggerService } from "../../../api/logger/logger";
import { createMockLoggerService } from "../../../api/logger/mockLogger";
import { createMockUsersService } from "../../../api/users/mockUsersService";
import { UsersService } from "../../../api/users/usersService";
import { createMockUtilsService } from "../../../api/utils/mockUtilsService";
import { UtilsService } from "../../../api/utils/utilsService";
import { HandleState } from "../../../models";
import { testUtils } from "../../../test";
import { CheckUnknownHandlesController } from "./checkUnknownHandles";

describe("CheckUnknownHandlesController", () => {
  const usersService = createMockUsersService();
  const codeforcesService = createMockCodeforces();
  const loggerService = createMockLoggerService();
  const utilsService = createMockUtilsService();
  const controller = new CheckUnknownHandlesController(
    usersService as unknown as UsersService,
    codeforcesService as unknown as CodeforcesService,
    loggerService as unknown as LoggerService,
    utilsService as unknown as UtilsService
  );

  beforeEach(() => jest.clearAllMocks());

  test("fetchUsersByHandleState() error", async () => {
    usersService.fetchUsersByHandleState.mockRejectedValue(new Error("oh no!"));
    await controller.onSchedule();

    expect(loggerService.error).toHaveBeenCalled();
    expect(usersService.markAsInvalid).not.toHaveBeenCalled();
    expect(usersService.markAsValid).not.toHaveBeenCalled();
  });

  test("no users", async () => {
    usersService.fetchUsersByHandleState.mockResolvedValue([]);
    await controller.onSchedule();

    expect(usersService.fetchUsersByHandleState).toHaveBeenCalledWith(
      HandleState.UNKNOWN,
      controller.BATCH_SIZE
    );
    expect(usersService.markAsInvalid).not.toHaveBeenCalled();
    expect(usersService.markAsValid).not.toHaveBeenCalled();
  });

  test("fetchRatings() error", async () => {
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
    usersService.fetchUsersByHandleState.mockResolvedValue([bobUser, johnUser]);
    codeforcesService.fetchRatings.mockRejectedValue(new Error("oh no!"));
    await controller.onSchedule();

    expect(codeforcesService.fetchRatings).toHaveBeenCalledWith([bobUser.handle, johnUser.handle]);
    expect(loggerService.error).toHaveBeenCalled();
    expect(usersService.markAsInvalid).not.toHaveBeenCalled();
    expect(usersService.markAsValid).not.toHaveBeenCalled();
  });

  test("invalid handles", async () => {
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
    usersService.fetchUsersByHandleState.mockResolvedValue([bobUser, johnUser]);
    codeforcesService.fetchRatings.mockResolvedValue({
      users: [],
      invalidHandles: [johnUser.handle]
    });
    await controller.onSchedule();

    expect(usersService.markAsInvalid).toHaveBeenCalledWith([johnUser]);
    expect(usersService.markAsValid).not.toHaveBeenCalled();
  });

  test("markAsInvalid() error", async () => {
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
    usersService.fetchUsersByHandleState.mockResolvedValue([bobUser, johnUser]);
    codeforcesService.fetchRatings.mockResolvedValue({
      users: [],
      invalidHandles: [johnUser.handle]
    });
    usersService.markAsInvalid.mockRejectedValue(new Error("oh no!"));
    await controller.onSchedule();

    expect(loggerService.error).toHaveBeenCalled();
  });

  test("valid handles", async () => {
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
    usersService.fetchUsersByHandleState.mockResolvedValue([bobUser, johnUser]);
    const bobCodeforcesUser = testUtils.createCodeforcesUser({
      handle: "bob",
      rank: "newbie",
      rating: 1000,
      color: "gray"
    });
    const johnCodeforcesUser = testUtils.createCodeforcesUser({
      handle: "john",
      rank: "newbie",
      rating: 1100,
      color: "gray"
    });
    codeforcesService.fetchRatings.mockResolvedValue({
      users: [bobCodeforcesUser, johnCodeforcesUser],
      invalidHandles: []
    });
    await controller.onSchedule();

    expect(usersService.markAsInvalid).not.toHaveBeenCalled();
    expect(usersService.markAsValid).toHaveBeenCalledWith([bobUser, johnUser]);
  });

  test("markAsValid() error", async () => {
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
    usersService.fetchUsersByHandleState.mockResolvedValue([bobUser, johnUser]);
    const bobCodeforcesUser = testUtils.createCodeforcesUser({
      handle: "bob",
      rank: "newbie",
      rating: 1000,
      color: "gray"
    });
    const johnCodeforcesUser = testUtils.createCodeforcesUser({
      handle: "john",
      rank: "newbie",
      rating: 1100,
      color: "gray"
    });
    codeforcesService.fetchRatings.mockResolvedValue({
      users: [bobCodeforcesUser, johnCodeforcesUser],
      invalidHandles: []
    });
    usersService.markAsValid.mockRejectedValue(new Error("oh no!"));
    await controller.onSchedule();

    expect(loggerService.error).toHaveBeenCalled();
  });
});
