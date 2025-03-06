import { Analytics, AnalyticsType } from "../../models";
import { MessagesService } from "../messages/messagesService";
import { createMockMessagesService } from "../messages/mockMessagesService";
import { createMockUsersService } from "../users/mockUsersService";
import { UsersService } from "../users/usersService";
import { AnalyticsService } from "./analyticsService";

describe("AnalyticsService", () => {
  const usersService = createMockUsersService();
  const messagesService = createMockMessagesService();
  const service = new AnalyticsService(
    usersService as unknown as UsersService,
    messagesService as unknown as MessagesService
  );

  test("getAnalytics() users", async () => {
    const expected: Analytics = {
      schemaVersion: 1,
      label: "Active Users",
      message: "10"
    };
    usersService.getUsersCount.mockResolvedValue(10);
    const actual = await service.getAnalytics(AnalyticsType.USERS);

    expect(actual).toEqual(expected);
    expect(usersService.getUsersCount).toHaveBeenCalled();
  });

  test("getAnalytics() users error", async () => {
    const error = new Error("oh no!");
    usersService.getUsersCount.mockRejectedValue(error);

    await expect(service.getAnalytics(AnalyticsType.USERS)).rejects.toBe(error);
  });

  test("getAnalytics() messages", async () => {
    const expected: Analytics = {
      schemaVersion: 1,
      label: "Rating Changes Sent",
      message: "10"
    };
    messagesService.getMessagesCount.mockResolvedValue(10);
    const actual = await service.getAnalytics(AnalyticsType.MESSAGES);

    expect(actual).toEqual(expected);
    expect(messagesService.getMessagesCount).toHaveBeenCalled();
  });

  test("getAnalytics() messages error", async () => {
    const error = new Error("oh no!");
    messagesService.getMessagesCount.mockRejectedValue(error);

    await expect(service.getAnalytics(AnalyticsType.MESSAGES)).rejects.toBe(error);
  });

  test("getAnalytics() error", async () => {
    await expect(service.getAnalytics(undefined as any)).rejects.toEqual(
      new Error('unexpected analytics type "undefined"')
    );
  });
});
