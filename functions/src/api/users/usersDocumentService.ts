import { FieldValue } from "firebase-admin/firestore";
import {
  AddUserArg,
  FirebaseUpdateUser,
  FirebaseWriteUser,
  HandleState,
  UpdateUserArg
} from "../../models";

export class UsersDocumentService {
  private static instance: UsersDocumentService;

  static getInstance(): UsersDocumentService {
    if (!this.instance) {
      this.instance = new UsersDocumentService();
    }

    return this.instance;
  }

  createDocumentForNewUser({ email, handle }: AddUserArg): FirebaseWriteUser {
    const timestamp = FieldValue.serverTimestamp();

    return {
      email,
      handle,
      data: null,
      state: HandleState.UNKNOWN,
      created: timestamp,
      lastUpdated: timestamp
    };
  }

  createChangesToExistingUser({
    handle,
    state,
    data
  }: Omit<UpdateUserArg, "id" | "email">): FirebaseUpdateUser {
    return {
      ...(handle === undefined ? {} : { handle }),
      ...(data === undefined ? {} : { data }),
      ...(state === undefined ? {} : { state }),
      lastUpdated: FieldValue.serverTimestamp()
    };
  }
}
