import { initializeApp } from "firebase-admin/app";
import { HttpsOptions, onRequest } from "firebase-functions/https";
import { onSchedule, ScheduleOptions } from "firebase-functions/scheduler";
import { AnalyticsController } from "./controllers/http/analytics/analytics";
import { DebugController } from "./controllers/http/debug/debug";
import { RegisterController } from "./controllers/http/register/register";
import { CheckRatingsController } from "./controllers/timer/checkRatings/checkRatings";
import { CheckUnknownHandlesController } from "./controllers/timer/checkUnknownHandles/checkUnknownHandles";
import { ProcessInvalidHandlesController } from "./controllers/timer/processInvalidHandles/processInvalidHandles";
import { SendInvalidHandleEmailsController } from "./controllers/timer/sendInvalidHandleEmails/sendInvalidHandleEmails";
import { SendRatingChangeEmailsController } from "./controllers/timer/sendRatingChangeEmails/sendRatingChangeEmails";

const EVERY_MINUTE = "*/1 * * * *";

const SECRETS = ["AUTH_TOKEN", "MAILGUN_WEBHOOK_KEY", "MAILGUN_API_KEY"];

const ON_REQUEST_CONFIG: HttpsOptions = {
  secrets: SECRETS,
  maxInstances: 5,
  concurrency: 5
};

const ON_SCHEDULE_CONFIG: ScheduleOptions = {
  secrets: SECRETS,
  schedule: EVERY_MINUTE,
  maxInstances: 1
};

initializeApp();

exports.register = onRequest(ON_REQUEST_CONFIG, (req, res) =>
  RegisterController.getInstance().onRequest(req, res)
);

exports.debug = onRequest(ON_REQUEST_CONFIG, (req, res) =>
  DebugController.getInstance().onRequest(req, res)
);

exports.analytics = onRequest(ON_REQUEST_CONFIG, (req, res) =>
  AnalyticsController.getInstance().onRequest(req, res)
);

exports.checkUnknownHandles = onSchedule(ON_SCHEDULE_CONFIG, () =>
  CheckUnknownHandlesController.getInstance().onSchedule()
);

exports.processInvalidHandles = onSchedule(ON_SCHEDULE_CONFIG, () =>
  ProcessInvalidHandlesController.getInstance().onSchedule()
);

exports.checkRatings = onSchedule(ON_SCHEDULE_CONFIG, () =>
  CheckRatingsController.getInstance().onSchedule()
);

exports.sendInvalidHandleEmails = onSchedule(ON_SCHEDULE_CONFIG, () =>
  SendInvalidHandleEmailsController.getInstance().onSchedule()
);

exports.sendRatingChangeEmails = onSchedule(ON_SCHEDULE_CONFIG, () =>
  SendRatingChangeEmailsController.getInstance().onSchedule()
);
