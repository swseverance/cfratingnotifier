import { Response } from "express";
import { Request } from "firebase-functions/https";
import StatusCode from "status-code-enum";
import { AnalyticsService } from "../../../api/analytics/analyticsService";
import { createMockAnalyticsService } from "../../../api/analytics/mockAnalyticsService";
import { LoggerService } from "../../../api/logger/logger";
import { createMockLoggerService } from "../../../api/logger/mockLogger";
import { Analytics, AnalyticsType } from "../../../models";
import { AnalyticsController } from "./analytics";

describe("AnalyticsController", () => {
  const analyticsService = createMockAnalyticsService();
  const loggerService = createMockLoggerService();
  const controller = new AnalyticsController(
    analyticsService as unknown as AnalyticsService,
    loggerService as unknown as LoggerService
  );

  test("success", async () => {
    const req = {
      query: { type: AnalyticsType.USERS }
    };
    const res = {
      json: jest.fn()
    };
    const analytics: Analytics = {
      schemaVersion: 1,
      label: "Users",
      message: "44"
    };
    analyticsService.getAnalytics.mockResolvedValue(analytics);
    await controller.onRequest(req as unknown as Request, res as unknown as Response);

    expect(res.json).toHaveBeenCalledWith(analytics);
    expect(analyticsService.getAnalytics).toHaveBeenCalledWith(AnalyticsType.USERS);
  });

  test("failure", async () => {
    const req = {
      query: { type: AnalyticsType.USERS }
    };
    const res = {
      sendStatus: jest.fn()
    };
    analyticsService.getAnalytics.mockRejectedValue(new Error("oh no!"));
    await controller.onRequest(req as unknown as Request, res as unknown as Response);

    expect(loggerService.error).toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(StatusCode.ServerErrorInternal);
  });
});
