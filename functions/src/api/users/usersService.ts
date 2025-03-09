import { getFirestore } from "firebase-admin/firestore";
import {
  AddUserArg,
  FirebaseReadUser,
  FirebaseUpdateUser,
  FirebaseWriteUser,
  HandleState,
  UpdateUserArg,
  User
} from "../../models";
import { UsersDocumentService } from "./usersDocumentService";

export const USERS_COLLECTION = "users";

const toUser = (
  doc: FirebaseFirestore.QueryDocumentSnapshot<
    FirebaseFirestore.DocumentData,
    FirebaseFirestore.DocumentData
  >
): User => ({
  ...(doc.data() as FirebaseReadUser),
  id: doc.id
});

export class UsersService {
  private static instance: UsersService;

  static getInstance(): UsersService {
    if (!this.instance) {
      this.instance = new UsersService();
    }

    return this.instance;
  }

  constructor(private usersDocumentService = UsersDocumentService.getInstance()) {}

  async fetchUserByEmail(email: string): Promise<User | null> {
    try {
      const snapshot = await getFirestore()
        .collection(USERS_COLLECTION)
        .where("email", "==", email)
        .get();

      return snapshot.empty ? null : toUser(snapshot.docs[0]);
    } catch (error) {
      throw error;
    }
  }

  async fetchUsersByHandle(handle: string): Promise<User[]> {
    try {
      const snapshot = await getFirestore()
        .collection(USERS_COLLECTION)
        .where("handle", "==", handle)
        .get();

      return snapshot.docs.map(toUser);
    } catch (error) {
      throw error;
    }
  }

  async registerUser({ email, handle }: AddUserArg): Promise<void> {
    try {
      const data: FirebaseWriteUser = this.usersDocumentService.createDocumentForNewUser({
        email,
        handle
      });

      await getFirestore().collection(USERS_COLLECTION).add(data);
    } catch (error) {
      throw error;
    }
  }

  async reRegisterUser({ id, handle }: UpdateUserArg): Promise<void> {
    try {
      const data: FirebaseUpdateUser = this.usersDocumentService.createChangesToExistingUser({
        handle,
        data: null,
        state: HandleState.UNKNOWN
      });

      await getFirestore().collection(USERS_COLLECTION).doc(id).set(data, { merge: true });
    } catch (error) {
      throw error;
    }
  }

  async fetchUsersByHandleState(state: HandleState, batchSize: number = Infinity): Promise<User[]> {
    try {
      let query = getFirestore()
        .collection(USERS_COLLECTION)
        .where("state", "==", state)
        .orderBy("lastUpdated", "asc");

      if (batchSize !== Infinity) {
        query = query.limit(batchSize);
      }

      const snapshot = await query.get();

      return snapshot.docs.map(toUser);
    } catch (error) {
      throw error;
    }
  }

  async markAsInvalid(users: User[]): Promise<void> {
    try {
      const batch = getFirestore().batch();

      const collectionRef = getFirestore().collection(USERS_COLLECTION);

      for (const { id } of users) {
        const updateDoc: FirebaseUpdateUser = this.usersDocumentService.createChangesToExistingUser(
          {
            state: HandleState.INVALID
          }
        );

        batch.update(collectionRef.doc(id), updateDoc);
      }

      await batch.commit();
    } catch (error) {
      throw error;
    }
  }

  async markAsValid(users: User[]): Promise<void> {
    try {
      const batch = getFirestore().batch();

      const collectionRef = getFirestore().collection(USERS_COLLECTION);

      for (const { id } of users) {
        const updateDoc: FirebaseUpdateUser = this.usersDocumentService.createChangesToExistingUser(
          {
            state: HandleState.VALID
          }
        );

        batch.update(collectionRef.doc(id), updateDoc);
      }

      await batch.commit();
    } catch (error) {
      throw error;
    }
  }

  async updateUsersData(users: User[]): Promise<void> {
    try {
      const batch = getFirestore().batch();

      const collectionRef = getFirestore().collection(USERS_COLLECTION);

      for (const { id, data } of users) {
        const document: FirebaseUpdateUser = this.usersDocumentService.createChangesToExistingUser({
          data
        });

        batch.update(collectionRef.doc(id), document);
      }

      await batch.commit();
    } catch (error) {
      throw error;
    }
  }

  async deleteUsers(users: User[]): Promise<void> {
    try {
      const batch = getFirestore().batch();

      const collectionRef = getFirestore().collection(USERS_COLLECTION);

      for (const { id } of users) {
        batch.delete(collectionRef.doc(id));
      }

      await batch.commit();
    } catch (error) {
      throw error;
    }
  }

  async getUsersCount(): Promise<number> {
    try {
      const snapshot = await getFirestore()
        .collection(USERS_COLLECTION)
        .where("state", "==", HandleState.VALID)
        .count()
        .get();

      return snapshot.data().count;
    } catch (error) {
      throw error;
    }
  }
}
