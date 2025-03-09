export const createMockConfigService = (
  config: {
    MAILGUN_API_KEY?: string;
    AUTH_TOKEN?: string;
    MAILGUN_WEBHOOK_KEY?: string;
    ENVIRONMENT?: string;
  } = {
    MAILGUN_API_KEY: "",
    AUTH_TOKEN: "",
    MAILGUN_WEBHOOK_KEY: "",
    ENVIRONMENT: ""
  }
) => ({
  MAILGUN_API_KEY: config.MAILGUN_API_KEY ?? "",
  AUTH_TOKEN: config.AUTH_TOKEN ?? "",
  MAILGUN_WEBHOOK_KEY: config.MAILGUN_WEBHOOK_KEY ?? "",
  ENVIRONMENT: config.ENVIRONMENT ?? ""
});
