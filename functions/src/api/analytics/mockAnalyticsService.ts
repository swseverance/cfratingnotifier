import { Analytics, AnalyticsType } from "../../models";

export const createMockAnalyticsService = () => ({
  getAnalytics: jest.fn<Promise<Analytics>, [AnalyticsType]>()
});
