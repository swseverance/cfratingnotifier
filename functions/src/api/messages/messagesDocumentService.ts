import { FieldValue } from "firebase-admin/firestore";
import {
  AddMessageArg,
  FirebaseUpdateMessage,
  FirebaseWriteMessage,
  MessageState,
  UpdateMessageArg
} from "../../models";

export class MessagesDocumentService {
  private static instance: MessagesDocumentService;

  static getInstance(): MessagesDocumentService {
    if (!this.instance) {
      this.instance = new MessagesDocumentService();
    }

    return this.instance;
  }

  createDocumentForNewMessage({ email, type, data }: AddMessageArg): FirebaseWriteMessage {
    const timestamp = FieldValue.serverTimestamp();

    return {
      email,
      type,
      data,
      state: MessageState.UNSENT,
      created: timestamp,
      lastUpdated: timestamp
    };
  }

  createChangesToExistingMessage({
    email,
    data,
    type,
    state
  }: Omit<UpdateMessageArg, "id">): FirebaseUpdateMessage {
    return {
      ...(email === undefined ? {} : { email }),
      ...(data === undefined ? {} : { data }),
      ...(type === undefined ? {} : { type }),
      ...(state === undefined ? {} : { state }),
      lastUpdated: FieldValue.serverTimestamp()
    };
  }
}
