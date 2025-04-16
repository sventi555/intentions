import { CallableOptions, HttpsError } from "firebase-functions/https";
import { onCall } from "firebase-functions/v2/https";
import { v4 as uuid } from "uuid";
import z from "zod";
import { auth, db, functionOpts } from "../app";
import { parseValidatedData } from "../validate";

const opts: CallableOptions = { ...functionOpts };

const createUserSchema = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
  isPrivate: z.boolean(),
});
export const createUser = onCall(opts, async (req) => {
  const { username, email, isPrivate, password } = parseValidatedData(
    req,
    createUserSchema,
  );

  const existingEmail =
    (await db.collection("users").where("email", "==", email).get()).size > 0;
  if (existingEmail) {
    throw new HttpsError("already-exists", "Email already taken.");
  }

  const existingUsername =
    (await db.collection("users").where("username", "==", username).get())
      .size > 0;
  if (existingUsername) {
    throw new HttpsError("already-exists", "Username already taken.");
  }

  try {
    await db.runTransaction(async (transaction) => {
      const userId = uuid();
      const userDoc = db.doc(`users/${userId}`);
      transaction.create(userDoc, { email, username, private: isPrivate });

      await auth.createUser({ email, password });
    });
  } catch {
    throw new HttpsError("internal", "Failed to create user.");
  }
});
