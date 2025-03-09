import { Response } from "express";
import { Request } from "firebase-functions/https";
import StatusCode from "status-code-enum";
import { LoggerService } from "../../../api/logger/logger";
import { createMockLoggerService } from "../../../api/logger/mockLogger";
import { MessagesService } from "../../../api/messages/messagesService";
import { createMockMessagesService } from "../../../api/messages/mockMessagesService";
import { createMockUsersService } from "../../../api/users/mockUsersService";
import { UsersService } from "../../../api/users/usersService";
import { createMockUtilsService } from "../../../api/utils/mockUtilsService";
import { UtilsService } from "../../../api/utils/utilsService";
import { DebugController } from "./debug";

describe("DebugController", () => {
  it("prevent unauthorized", async () => {
    const utilsService = createMockUtilsService();
    const usersService = createMockUsersService();
    const messagesService = createMockMessagesService();
    const loggerService = createMockLoggerService();
    const controller = new DebugController(
      utilsService as unknown as UtilsService,
      usersService as unknown as UsersService,
      messagesService as unknown as MessagesService,
      loggerService as unknown as LoggerService
    );
    const res = {
      set: jest.fn(),
      sendStatus: jest.fn(),
      json: jest.fn()
    };
    utilsService.isAuthenticated.mockReturnValue(false);
    usersService.fetchUsersByHandleState.mockRejectedValue([]);
    await controller.onRequest(
      {
        headers: {}
      } as Request,
      res as unknown as Response
    );

    expect(res.sendStatus).toHaveBeenCalledWith(StatusCode.ClientErrorForbidden);
    expect(res.json).not.toHaveBeenCalled();
    expect(usersService.fetchUsersByHandleState).not.toHaveBeenCalled();
  });
});
