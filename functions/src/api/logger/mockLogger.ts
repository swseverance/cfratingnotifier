export const createMockLogger = () => ({
  log: jest.fn<void, [string, any]>(),
  warn: jest.fn<void, [string, any]>(),
  error: jest.fn<void, [string, Error]>()
});
