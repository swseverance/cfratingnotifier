import { Response } from "express";
import { Request } from "firebase-functions/https";
import StatusCode from "status-code-enum";
import { LoggerService } from "../../../api/logger/logger";
import { MailgunService } from "../../../api/mailgun/mailgunService";
import { UsersService } from "../../../api/users/usersService";
import { UtilsService } from "../../../api/utils/utilsService";
import { ParsedIncomingMail, RawIncomingMail, User } from "../../../models";

/**
 * Overview:
 *
 * 1) If the user already exists we reset their state.
 * 2) If the user does not already exist we create them
 */
export class RegisterController {
  private static instance: RegisterController;

  readonly MAILGUN_SUCCESS = StatusCode.SuccessOK;
  readonly MAILGUN_TRY_AGAIN = StatusCode.ServerErrorInternal;
  readonly MAILGUN_DO_NOT_TRY_AGAIN = StatusCode.ClientErrorNotAcceptable;

  static getInstance(): RegisterController {
    if (!this.instance) {
      this.instance = new RegisterController();
    }

    return this.instance;
  }

  constructor(
    private utilsService = UtilsService.getInstance(),
    private mailgunService = MailgunService.getInstance(),
    private usersService = UsersService.getInstance(),
    private loggerService = LoggerService.getInstance()
  ) {}

  async onRequest(req: Request, res: Response): Promise<void> {
    const rawIncomingMail: RawIncomingMail = req.body;

    this.loggerService.log("received email", { email: req.body });

    const mail: ParsedIncomingMail = {
      email: this.utilsService.toString(rawIncomingMail.sender),
      handle: this.utilsService.toString(rawIncomingMail.subject),
      signature: this.utilsService.toString(rawIncomingMail.signature),
      timestamp: this.utilsService.toString(rawIncomingMail.timestamp),
      token: this.utilsService.toString(rawIncomingMail.token)
    };

    if (
      !this.utilsService.isAuthenticated(req.headers) &&
      !this.mailgunService.isSignatureValid(mail)
    ) {
      res.sendStatus(this.MAILGUN_DO_NOT_TRY_AGAIN);

      return;
    }

    if (!mail.email) {
      res.sendStatus(this.MAILGUN_DO_NOT_TRY_AGAIN);

      return;
    }

    let user: User | null;

    try {
      user = await this.usersService.fetchUserByEmail(mail.email);
    } catch (error) {
      this.loggerService.error("fetchUserByEmail() error", error as Error);

      res.sendStatus(this.MAILGUN_TRY_AGAIN);

      return;
    }

    if (user) {
      try {
        await this.usersService.reRegisterUser({
          id: user.id,
          handle: mail.handle
        });
      } catch (error) {
        this.loggerService.error("reRegisterUser() error", error as Error);

        res.sendStatus(this.MAILGUN_TRY_AGAIN);

        return;
      }
    } else {
      try {
        await this.usersService.registerUser({
          email: mail.email,
          handle: mail.handle
        });
      } catch (error) {
        this.loggerService.error("registerUser() error", error as Error);

        res.sendStatus(this.MAILGUN_TRY_AGAIN);

        return;
      }
    }

    res.sendStatus(this.MAILGUN_SUCCESS);
  }
}
