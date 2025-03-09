import { Response } from "express";
import { Request } from "firebase-functions/https";
import { LoggerService } from "../../../api/logger/logger";
import { createMockLoggerService } from "../../../api/logger/mockLogger";
import { MailgunService } from "../../../api/mailgun/mailgunService";
import { createMockMailgunService } from "../../../api/mailgun/mockMailgunService";
import { createMockUsersService } from "../../../api/users/mockUsersService";
import { UsersService } from "../../../api/users/usersService";
import { createMockUtilsService } from "../../../api/utils/mockUtilsService";
import { UtilsService } from "../../../api/utils/utilsService";
import { testUtils } from "../../../test";
import { RegisterController } from "./register";

describe("RegisterController", () => {
  const utilsService = createMockUtilsService();
  const mailgunService = createMockMailgunService();
  const usersService = createMockUsersService();
  const loggerService = createMockLoggerService();
  const controller = new RegisterController(
    utilsService as unknown as UtilsService,
    mailgunService as unknown as MailgunService,
    usersService as unknown as UsersService,
    loggerService as unknown as LoggerService
  );

  beforeEach(() => jest.clearAllMocks());

  test("improperly signed mail", async () => {
    const req = {
      body: {}
    };
    const res = {
      sendStatus: jest.fn()
    };
    utilsService.isAuthenticated.mockReturnValue(false);
    mailgunService.isSignatureValid.mockReturnValue(false);
    await controller.onRequest(req as Request, res as unknown as Response);

    expect(res.sendStatus).toHaveBeenCalledWith(controller.MAILGUN_DO_NOT_TRY_AGAIN);
  });

  it("empty email", async () => {
    const req = {
      body: {}
    };
    const res = {
      sendStatus: jest.fn()
    };
    utilsService.isAuthenticated.mockReturnValue(false);
    mailgunService.isSignatureValid.mockReturnValue(true);
    await controller.onRequest(req as Request, res as unknown as Response);

    expect(res.sendStatus).toHaveBeenCalledWith(controller.MAILGUN_DO_NOT_TRY_AGAIN);
  });

  it("fetchUserByEmail() error", async () => {
    const bobUser = testUtils.createUser({
      id: "123",
      handle: "bob",
      email: "bob@example.com",
      rank: "newbie",
      rating: 1000,
      color: "gray"
    });
    const req = {
      body: {
        sender: bobUser.email
      }
    };
    const res = {
      sendStatus: jest.fn()
    };
    utilsService.isAuthenticated.mockReturnValue(false);
    mailgunService.isSignatureValid.mockReturnValue(true);
    usersService.fetchUserByEmail.mockRejectedValue(new Error("oh no!"));
    await controller.onRequest(req as Request, res as unknown as Response);

    expect(loggerService.error).toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(controller.MAILGUN_TRY_AGAIN);
    expect(usersService.registerUser).not.toHaveBeenCalled();
    expect(usersService.reRegisterUser).not.toHaveBeenCalled();
  });

  it("reRegisterUser() success", async () => {
    const bobUser = testUtils.createUser({
      id: "123",
      handle: "bob",
      email: "bob@example.com",
      rank: "newbie",
      rating: 1000,
      color: "gray"
    });
    const req = {
      body: {
        sender: bobUser.email,
        subject: "tourist"
      }
    };
    const res = {
      sendStatus: jest.fn()
    };
    utilsService.isAuthenticated.mockReturnValue(false);
    mailgunService.isSignatureValid.mockReturnValue(true);
    usersService.fetchUserByEmail.mockResolvedValue(bobUser);
    await controller.onRequest(req as Request, res as unknown as Response);

    expect(usersService.registerUser).not.toHaveBeenCalled();
    expect(usersService.reRegisterUser).toHaveBeenCalledWith({
      id: bobUser.id,
      handle: "tourist"
    });
    expect(res.sendStatus).toHaveBeenCalledWith(controller.MAILGUN_SUCCESS);
  });

  it("reRegisterUser() error", async () => {
    const bobUser = testUtils.createUser({
      id: "123",
      handle: "bob",
      email: "bob@example.com",
      rank: "newbie",
      rating: 1000,
      color: "gray"
    });
    const req = {
      body: {
        sender: bobUser.email,
        subject: "tourist"
      }
    };
    const res = {
      sendStatus: jest.fn()
    };
    utilsService.isAuthenticated.mockReturnValue(false);
    mailgunService.isSignatureValid.mockReturnValue(true);
    usersService.fetchUserByEmail.mockResolvedValue(bobUser);
    usersService.reRegisterUser.mockRejectedValue(new Error("oh no!"));
    await controller.onRequest(req as Request, res as unknown as Response);

    expect(usersService.reRegisterUser).toHaveBeenCalledWith({
      id: bobUser.id,
      handle: "tourist"
    });
    expect(loggerService.error).toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(controller.MAILGUN_TRY_AGAIN);
  });

  it("registerUser() success", async () => {
    const req = {
      body: {
        sender: "bob@example.com",
        subject: "tourist"
      }
    };
    const res = {
      sendStatus: jest.fn()
    };
    utilsService.isAuthenticated.mockReturnValue(false);
    mailgunService.isSignatureValid.mockReturnValue(true);
    usersService.fetchUserByEmail.mockResolvedValue(null);
    await controller.onRequest(req as Request, res as unknown as Response);

    expect(usersService.reRegisterUser).not.toHaveBeenCalled();
    expect(usersService.registerUser).toHaveBeenCalledWith({
      email: "bob@example.com",
      handle: "tourist"
    });
    expect(res.sendStatus).toHaveBeenCalledWith(controller.MAILGUN_SUCCESS);
  });

  it("registerUser() error", async () => {
    const req = {
      body: {
        sender: "bob@example.com",
        subject: "tourist"
      }
    };
    const res = {
      sendStatus: jest.fn()
    };
    utilsService.isAuthenticated.mockReturnValue(false);
    mailgunService.isSignatureValid.mockReturnValue(true);
    usersService.fetchUserByEmail.mockResolvedValue(null);
    usersService.registerUser.mockRejectedValue(new Error("oh no!"));
    await controller.onRequest(req as Request, res as unknown as Response);

    expect(loggerService.error).toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(controller.MAILGUN_TRY_AGAIN);
  });

  it("success", async () => {
    const req = {
      body: {
        sender: "bob@example.com",
        subject: "tourist"
      }
    };
    const res = {
      sendStatus: jest.fn()
    };
    utilsService.isAuthenticated.mockReturnValue(false);
    mailgunService.isSignatureValid.mockReturnValue(true);
    usersService.fetchUserByEmail.mockResolvedValue(null);
    usersService.registerUser.mockResolvedValue(undefined);
    await controller.onRequest(req as Request, res as unknown as Response);

    expect(res.sendStatus).toHaveBeenCalledWith(controller.MAILGUN_SUCCESS);
    expect(usersService.registerUser).toHaveBeenCalledWith({
      email: "bob@example.com",
      handle: "tourist"
    });
  });
});
