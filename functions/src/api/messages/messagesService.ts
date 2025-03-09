import { getFirestore } from "firebase-admin/firestore";
import {
  AddMessageArg,
  CodeforcesUser,
  FirebaseReadMessage,
  FirebaseUpdateMessage,
  FirebaseWriteMessage,
  Message,
  MessageState,
  MessageType,
  User
} from "../../models";
import { MessagesDocumentService } from "./messagesDocumentService";

export const MESSAGES_COLLECTION = "messages";

const toMessage = (
  doc: FirebaseFirestore.QueryDocumentSnapshot<
    FirebaseFirestore.DocumentData,
    FirebaseFirestore.DocumentData
  >
): Message => ({
  ...(doc.data() as FirebaseReadMessage),
  id: doc.id
});

export class MessagesService {
  private static instance: MessagesService;

  static getInstance(): MessagesService {
    if (!this.instance) {
      this.instance = new MessagesService();
    }

    return this.instance;
  }

  constructor(private messagesDocumentService = MessagesDocumentService.getInstance()) {}

  async createMessages(messages: AddMessageArg[]): Promise<void> {
    try {
      const batch = getFirestore().batch();

      const collectionRef = getFirestore().collection(MESSAGES_COLLECTION);

      for (const { email, type, data } of messages) {
        const document: FirebaseWriteMessage =
          this.messagesDocumentService.createDocumentForNewMessage({
            email,
            type,
            data
          });

        batch.set(collectionRef.doc(), document);
      }

      await batch.commit();
    } catch (error) {
      throw error;
    }
  }

  createInvalidHandleMessages(users: User[]) {
    return this.createMessages(
      users.map(({ email, handle }) => ({
        type: MessageType.INVALID_HANDLE,
        email,
        data: { handle }
      }))
    );
  }

  createRatingChangeMessages(users: User[]) {
    return this.createMessages(
      users.map(({ email, handle, data }) => {
        // extract only the properties needed by the mailgun template
        const { rating, rank, color } = data as CodeforcesUser;

        return {
          type: MessageType.RATING_CHANGE,
          email,
          data: { rating, rank, color, handle }
        };
      })
    );
  }

  async fetchMessages(
    state: MessageState,
    type: MessageType,
    batchSize: number = Infinity
  ): Promise<Message[]> {
    try {
      let query = getFirestore()
        .collection(MESSAGES_COLLECTION)
        .where("state", "==", state)
        .where("type", "==", type)
        .orderBy("lastUpdated", "asc");

      if (batchSize !== Infinity) {
        query = query.limit(batchSize);
      }

      const snapshot = await query.get();

      return snapshot.docs.map(toMessage);
    } catch (error) {
      throw error;
    }
  }

  async fetchMessagesByHandle(handle: string): Promise<Message[]> {
    try {
      let query = getFirestore()
        .collection(MESSAGES_COLLECTION)
        .where("data.handle", "==", handle)
        .orderBy("lastUpdated", "asc");

      const snapshot = await query.get();

      return snapshot.docs.map(toMessage);
    } catch (error) {
      throw error;
    }
  }

  async markMessagesAsSent(messages: Message[]): Promise<void> {
    try {
      const batch = getFirestore().batch();

      const collectionRef = getFirestore().collection(MESSAGES_COLLECTION);

      for (const { id } of messages) {
        const document: FirebaseUpdateMessage =
          this.messagesDocumentService.createChangesToExistingMessage({
            state: MessageState.SENT
          });

        batch.update(collectionRef.doc(id), document);
      }

      await batch.commit();
    } catch (error) {
      throw error;
    }
  }

  async getMessagesCount(): Promise<number> {
    try {
      const snapshot = await getFirestore()
        .collection(MESSAGES_COLLECTION)
        .where("state", "==", MessageState.SENT)
        .where("type", "==", MessageType.RATING_CHANGE)
        .count()
        .get();

      return snapshot.data().count;
    } catch (error) {
      throw error;
    }
  }
}
