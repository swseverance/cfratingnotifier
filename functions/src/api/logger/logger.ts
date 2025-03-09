import { logger } from "firebase-functions";

const errorToObject = (error: any) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return error;
};

export class LoggerService {
  private static instance: LoggerService;

  static getInstance(): LoggerService {
    if (!this.instance) {
      this.instance = new LoggerService();
    }

    return this.instance;
  }

  log(message: string, context: any = {}) {
    logger.log(message, { context });
  }

  warn(message: string, context: any = {}) {
    logger.warn(message, { context });
  }

  error(message: string, context: Error) {
    logger.error(message, { context: errorToObject(context) });
  }
}
