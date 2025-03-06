import * as crypto from "crypto";
import FormData from "form-data";
import { readFileSync } from "fs";
import Mailgun from "mailgun.js";
import { IMailgunClient } from "mailgun.js/Interfaces/MailgunClient/IMailgunClient";
import { resolve } from "path";
import { Message, MessageData, MessageType, ParsedIncomingMail } from "../../models";
import { ConfigService } from "../config/configService";

const FROM_DEV = "Codeforces Rating Notifier DEV <notifications@cfratingnotifier.com>";

const FROM_PROD = "Codeforces Rating Notifier <notifications@cfratingnotifier.com>";

export class MailgunService {
  private static instance: MailgunService;

  private client!: IMailgunClient;

  static getInstance(): MailgunService {
    if (!this.instance) {
      this.instance = new MailgunService();
    }

    return this.instance;
  }

  constructor(private configService = ConfigService.getInstance()) {
    this.client = new Mailgun(FormData).client({
      username: "api",
      key: this.configService.MAILGUN_API_KEY
    });
  }

  isSignatureValid({ timestamp, token, signature }: ParsedIncomingMail): boolean {
    return (
      signature ===
      crypto
        .createHmac("sha256", this.configService.MAILGUN_WEBHOOK_KEY)
        .update(timestamp + token)
        .digest("hex")
    );
  }

  async sendMessages(messageType: MessageType, messages: Message[]): Promise<void> {
    try {
      const data = this.createMessageData(messageType, messages);

      await this.client.messages.create("cfratingnotifier.com", data);
    } catch (error) {
      throw error;
    }
  }

  private createMessageData(messageType: MessageType, messages: Message[]) {
    const recipients: Record<string, MessageData> = {};

    for (const { email, data } of messages) {
      recipients[email] = data;
    }

    const data = {
      from: this.configService.ENVIRONMENT === "DEV" ? FROM_DEV : FROM_PROD,
      to: Object.keys(recipients),
      "recipient-variables": JSON.stringify(recipients)
    };

    switch (messageType) {
      case MessageType.RATING_CHANGE: {
        return {
          ...data,
          html: readFileSync(
            resolve(__dirname, "..", "..", "templates", "ratingChange.html"),
            "utf-8"
          ),
          subject: "Rating Change"
        };
      }
      case MessageType.INVALID_HANDLE: {
        return {
          ...data,
          html: readFileSync(
            resolve(__dirname, "..", "..", "templates", "invalidHandle.html"),
            "utf-8"
          ),
          subject: "Invalid Handle"
        };
      }
    }
  }
}
