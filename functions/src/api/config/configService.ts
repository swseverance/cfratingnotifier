import { ENVIRONMENT } from "../../models";

export class ConfigService {
  private static instance: ConfigService;

  static getInstance(): ConfigService {
    if (!this.instance) {
      this.instance = new ConfigService();
    }

    return this.instance;
  }

  get MAILGUN_API_KEY(): string {
    return process.env.MAILGUN_API_KEY as string;
  }

  get AUTH_TOKEN(): string {
    return process.env.AUTH_TOKEN as string;
  }

  get MAILGUN_WEBHOOK_KEY(): string {
    return process.env.MAILGUN_WEBHOOK_KEY as string;
  }

  get ENVIRONMENT(): ENVIRONMENT {
    return (process.env.GCLOUD_PROJECT as string) === "cfmailer" ? "PROD" : "DEV";
  }
}
