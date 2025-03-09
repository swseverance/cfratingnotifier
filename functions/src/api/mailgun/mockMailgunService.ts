import { Message, MessageType, ParsedIncomingMail } from "../../models";

export const createMockMailgunService = () => ({
  isSignatureValid: jest.fn<boolean, [ParsedIncomingMail]>(),
  sendMessages: jest.fn<Promise<void>, [MessageType, Message[]]>()
});
