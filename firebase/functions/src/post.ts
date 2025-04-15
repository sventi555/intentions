import { HttpsError, onCall } from "firebase-functions/v2/https";
import { functionOpts } from "./app";

const opts = { ...functionOpts };

export const addPost = onCall(opts, async (req) => {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in to add post.");
  }

  // const requesterId = req.auth.uid;
});

// export const updatePost = onCall(opts, async (req) => {});
//
// export const deletePost = onCall(opts, async (req) => {});
