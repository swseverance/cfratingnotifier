import { RatingsResponse } from "../../models";

export const createMockCodeforces = () => ({
  fetchRatings: jest.fn<Promise<RatingsResponse>, [handles: string[]]>()
});
