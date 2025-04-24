import { CallableOptions, HttpsError } from "firebase-functions/https";
import { onCall } from "firebase-functions/v2/https";
import z from "zod";
import { db, functionOpts } from "../app";
import { parseValidatedData } from "../validate";

const opts: CallableOptions = { ...functionOpts };

const addIntentionSchema = z.object({
  name: z.string().nonempty(),
});
export const addIntention = onCall(opts, async (req) => {
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Must be signed in to add intention.",
    );
  }

  const requesterId = req.auth.uid;
  const { name } = parseValidatedData(req, addIntentionSchema);

  const existingIntention =
    (
      await db
        .collection("intentions")
        .where("userId", "==", requesterId)
        .where("name", "==", name)
        .get()
    ).size > 0;

  if (existingIntention) {
    throw new HttpsError(
      "already-exists",
      "User already has intention with same name.",
    );
  }

  const intentionData = { userId: requesterId, name, createdAt: Date.now() };
  await db.collection("intentions").add(intentionData);
});
