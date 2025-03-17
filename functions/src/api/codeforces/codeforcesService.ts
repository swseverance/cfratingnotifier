import axios, { AxiosRequestConfig, isAxiosError } from "axios";
import {
  CodeforcesApiFailureResponse,
  CodeforcesApiSuccessResponse,
  RatingsResponse
} from "../../models";
import { LoggerService } from "../logger/logger";

export const COLORS = {
  newbie: "rgb(128, 128, 128)",
  pupil: "rgb(0, 128, 0)",
  specialist: "rgb(3, 168, 158)",
  expert: "rgb(0, 0, 255)",
  "candidate master": "rgb(170, 0, 170)",
  master: "rgb(255, 140, 0)",
  "international master": "rgb(255, 140, 0)",
  grandmaster: "rgb(255, 0, 0)",
  "international grandmaster": "rgb(255, 0, 0)",
  "legendary grandmaster": "rgb(255, 0, 0)"
};

export const UNKNOWN_COLOR = "rgb(0, 0, 0)";

const getColor = (rank: string) => COLORS[rank as keyof typeof COLORS] ?? UNKNOWN_COLOR;

const isValidUsername = (username: string) => /^[a-zA-Z0-9._-]+$/.test(username);

const getInvalidHandle = (error: unknown): string | null =>
  isAxiosError(error) &&
  error.response &&
  error.response.data &&
  typeof (error.response.data as CodeforcesApiFailureResponse).comment === "string"
    ? error.response.data.comment.match(/handles: User with handle (\S+) not found/)?.[1]
    : null;

export class CodeforcesService {
  private static instance: CodeforcesService;

  readonly CONFIG: AxiosRequestConfig = {
    timeout: 30000
  };

  static getInstance() {
    if (!this.instance) {
      this.instance = new CodeforcesService();
    }

    return this.instance;
  }

  constructor(
    private http = axios,
    private loggerService = LoggerService.getInstance()
  ) {}

  async fetchRatings(handles: string[]): Promise<RatingsResponse> {
    if (!handles.length) {
      return {
        users: [],
        invalidHandles: []
      };
    }

    const usernames = Array.from(new Set(handles));

    const malformedHandles = usernames.filter((handle) => !isValidUsername(handle));

    if (malformedHandles.length) {
      return {
        users: [],
        invalidHandles: malformedHandles
      };
    }

    try {
      const {
        data: { result: users }
      } = await this.http.get<CodeforcesApiSuccessResponse>(
        `https://codeforces.com/api/user.info?handles=${usernames.join(
          ";"
        )}&checkHistoricHandles=false`,
        this.CONFIG
      );

      return {
        users: users.map((user) => ({
          ...user,
          color: getColor(user.rank)
        })),
        invalidHandles: []
      };
    } catch (error) {
      const invalidHandle = getInvalidHandle(error);

      if (invalidHandle) {
        return {
          users: [],
          invalidHandles: [invalidHandle]
        };
      }

      this.loggerService.error(
        "Unexpected error when fetching ratings from Codeforces",
        error as Error
      );

      throw error;
    }
  }
}
