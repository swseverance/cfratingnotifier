import { AxiosError } from "axios";
import {
  CodeforcesApiFailureResponse,
  CodeforcesApiSuccessResponse,
  RatingsResponse,
  RawCodeforcesUser
} from "../../models";
import { CodeforcesService, COLORS, UNKNOWN_COLOR } from "./codeforcesService";

describe("CodeforcesService", () => {
  const http = {
    get: jest.fn()
  };
  const loggerService = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
  const service = new CodeforcesService(http as any, loggerService as any);

  beforeEach(() => jest.clearAllMocks());

  test("empty list of handles", async () => {
    const actual = await service.fetchRatings([]);
    const expected: RatingsResponse = {
      users: [],
      invalidHandles: []
    };

    expect(actual).toEqual(expected);
  });

  test("malformed handles", async () => {
    const actual = await service.fetchRatings(["%ff$$$", "tourist", "~~~~~~~~"]);
    const expected: RatingsResponse = {
      users: [],
      invalidHandles: ["%ff$$$", "~~~~~~~~"]
    };

    expect(actual).toEqual(expected);
  });

  test("fetch single user", async () => {
    const user: RawCodeforcesUser = {
      lastName: "Korotkevich",
      country: "Belarus",
      lastOnlineTimeSeconds: 1741044460,
      city: "Gomel",
      rating: 3857,
      friendOfCount: 78865,
      titlePhoto: "https://userpic.codeforces.org/422/title/50a270ed4a722867.jpg",
      handle: "tourist",
      avatar: "https://userpic.codeforces.org/422/avatar/2b5dbe87f0d859a2.jpg",
      firstName: "Gennady",
      contribution: 0,
      organization: "ITMO University",
      rank: "legendary grandmaster",
      maxRating: 4009,
      registrationTimeSeconds: 1265987288,
      maxRank: "tourist"
    };
    const data: CodeforcesApiSuccessResponse = {
      status: "OK",
      result: [user]
    };
    http.get.mockResolvedValue({ data });
    const actual = await service.fetchRatings(["tourist"]);
    const expected: RatingsResponse = {
      users: [{ ...user, color: "rgb(255, 0, 0)" }],
      invalidHandles: []
    };

    expect(http.get).toHaveBeenCalledWith(
      "https://codeforces.com/api/user.info?handles=tourist&checkHistoricHandles=false",
      service.CONFIG
    );
    expect(actual).toEqual(expected);
  });

  test("fetch multiple users", async () => {
    const userA: RawCodeforcesUser = {
      lastName: "Korotkevich",
      country: "Belarus",
      lastOnlineTimeSeconds: 1741044460,
      city: "Gomel",
      rating: 3857,
      friendOfCount: 78865,
      titlePhoto: "https://userpic.codeforces.org/422/title/50a270ed4a722867.jpg",
      handle: "tourist",
      avatar: "https://userpic.codeforces.org/422/avatar/2b5dbe87f0d859a2.jpg",
      firstName: "Gennady",
      contribution: 0,
      organization: "ITMO University",
      rank: "tourist",
      maxRating: 4009,
      registrationTimeSeconds: 1265987288,
      maxRank: "tourist"
    };
    const userB: RawCodeforcesUser = {
      contribution: 0,
      lastOnlineTimeSeconds: 1741134936,
      rating: 1216,
      friendOfCount: 0,
      titlePhoto: "https://userpic.codeforces.org/no-title.jpg",
      rank: "pupil",
      handle: "swseverance",
      maxRating: 1216,
      avatar: "https://userpic.codeforces.org/no-avatar.jpg",
      registrationTimeSeconds: 1598815436,
      maxRank: "pupil"
    };
    const data: CodeforcesApiSuccessResponse = {
      status: "OK",
      result: [userA, userB]
    };
    http.get.mockResolvedValue({ data });
    const actual = await service.fetchRatings(["tourist", "swseverance"]);
    const expected: RatingsResponse = {
      users: [
        { ...userA, color: UNKNOWN_COLOR },
        {
          ...userB,
          color: COLORS["pupil"]
        }
      ],
      invalidHandles: []
    };

    expect(http.get).toHaveBeenCalledWith(
      "https://codeforces.com/api/user.info?handles=tourist;swseverance&checkHistoricHandles=false",
      service.CONFIG
    );
    expect(actual).toEqual(expected);
  });

  test("handle does not exist", async () => {
    const data: CodeforcesApiFailureResponse = {
      status: "FAILED",
      comment: "handles: User with handle asdfasdfazzzzzsdf not found"
    };
    const axiosError = new AxiosError();
    axiosError.response = { data } as any;
    http.get.mockRejectedValue(axiosError);
    const actual = await service.fetchRatings(["tourist", "asdfasdfazzzzzsdf"]);
    const expected: RatingsResponse = {
      users: [],
      invalidHandles: ["asdfasdfazzzzzsdf"]
    };

    expect(actual).toEqual(expected);
  });

  test("unexpected error", async () => {
    const error = new Error("oh no!");
    http.get.mockRejectedValue(error);

    await expect(service.fetchRatings(["swseverance"])).rejects.toBe(error);
    expect(loggerService.error).toHaveBeenCalled();
  });
});
