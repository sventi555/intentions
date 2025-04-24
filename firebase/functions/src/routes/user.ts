import { CallableOptions, HttpsError } from "firebase-functions/https";
import { onCall } from "firebase-functions/v2/https";
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
    const user = await auth.createUser({ email, password });
    await db
      .doc(`users/${user.uid}`)
      .create({ email, username, private: isPrivate });
  } catch {
    throw new HttpsError("internal", "Failed to create user.");
  }
});
