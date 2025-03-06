import { Response } from "express";
import { Request } from "firebase-functions/https";
import StatusCode from "status-code-enum";
import { LoggerService } from "../../../api/logger/logger";
import { MessagesService } from "../../../api/messages/messagesService";
import { UsersService } from "../../../api/users/usersService";
import { UtilsService } from "../../../api/utils/utilsService";
import { HandleState, MessageState, MessageType } from "../../../models";

export class DebugController {
  private static instance: DebugController;

  static getInstance(): DebugController {
    if (!this.instance) {
      this.instance = new DebugController();
    }

    return this.instance;
  }

  constructor(
    private utilsService = UtilsService.getInstance(),
    private usersService = UsersService.getInstance(),
    private messagesService = MessagesService.getInstance(),
    private loggerService = LoggerService.getInstance()
  ) {}

  async onRequest(req: Request, res: Response): Promise<void> {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type,Authorization");

    if (req.method === "OPTIONS") {
      res.status(204).send("");

      return;
    }

    if (!this.utilsService.isAuthenticated(req.headers)) {
      res.sendStatus(StatusCode.ClientErrorForbidden);

      return;
    }

    const handle = req.query["handle"] as string;

    if (handle) {
      try {
        res.json({
          users: await this.usersService.fetchUsersByHandle(handle),
          messages: await this.messagesService.fetchMessagesByHandle(handle)
        });
      } catch (error) {
        this.loggerService.error("debug() error", error as Error);
      }

      return;
    }

    try {
      const LIMIT = parseInt(req.query["limit"] as string);

      res.json({
        users: {
          unknown: await this.usersService.fetchUsersByHandleState(HandleState.UNKNOWN, LIMIT),
          invalid: await this.usersService.fetchUsersByHandleState(HandleState.INVALID, LIMIT),
          valid: await this.usersService.fetchUsersByHandleState(HandleState.VALID, LIMIT)
        },
        messages: {
          invalidHandle: {
            unsent: await this.messagesService.fetchMessages(
              MessageState.UNSENT,
              MessageType.INVALID_HANDLE,
              LIMIT
            ),
            sent: await this.messagesService.fetchMessages(
              MessageState.SENT,
              MessageType.INVALID_HANDLE,
              LIMIT
            )
          },
          ratingChange: {
            unsent: await this.messagesService.fetchMessages(
              MessageState.UNSENT,
              MessageType.RATING_CHANGE,
              LIMIT
            ),
            sent: await this.messagesService.fetchMessages(
              MessageState.SENT,
              MessageType.RATING_CHANGE,
              LIMIT
            )
          }
        }
      });
    } catch (error) {
      this.loggerService.error("debug() error", error as Error);

      res.sendStatus(500);
    }
  }
}
