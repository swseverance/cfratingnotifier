import { Response } from "express";
import { Request } from "firebase-functions/https";
import StatusCode from "status-code-enum";
import { AnalyticsService } from "../../../api/analytics/analyticsService";
import { LoggerService } from "../../../api/logger/logger";
import { Analytics, AnalyticsType } from "../../../models";

export class AnalyticsController {
  private static instance: AnalyticsController;

  static getInstance(): AnalyticsController {
    if (!this.instance) {
      this.instance = new AnalyticsController();
    }

    return this.instance;
  }

  constructor(
    private analyticsService = AnalyticsService.getInstance(),
    private loggerService = LoggerService.getInstance()
  ) {}

  async onRequest(req: Request, res: Response<Analytics>): Promise<void> {
    try {
      const analytics = await this.analyticsService.getAnalytics(
        req.query["type"] as AnalyticsType
      );

      res.json(analytics);
    } catch (error) {
      this.loggerService.error("getAnalytics() error", error as Error);

      res.sendStatus(StatusCode.ServerErrorInternal);
    }
  }
}
