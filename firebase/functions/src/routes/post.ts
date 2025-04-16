import {
  CallableOptions,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { db, functionOpts } from "../app";
import { parseValidatedData } from "../validate";

const opts: CallableOptions = { ...functionOpts };

const addPostSchema = z.object({
  intentionId: z.string(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
});
export const addPost = onCall(opts, async (req) => {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in to add post.");
  }

  const requesterId = req.auth.uid;
  const data = parseValidatedData(req, addPostSchema);

  // need to get the intention and the user object to embed within the post data
  const intention = await db.doc(`intentions/${data.intentionId}`).get();
  const intentionData = intention.data();
  if (!intentionData) {
    throw new HttpsError(
      "not-found",
      `An intention with id ${data.intentionId} does not exist.`,
    );
  }
  if (intentionData.userId !== requesterId) {
    throw new HttpsError(
      "permission-denied",
      "Intention is owned by another user.",
    );
  }

  const user = await db.doc(`users/${requesterId}`).get();
  const userData = user.data();
  if (!userData) {
    throw new HttpsError("internal", "User information is missing.");
  }

  const postData = {
    ...data,
    userId: requesterId,
    user: { username: userData.username, profilePic: userData.profilePic },
    intention: { name: intentionData.name },
    createdAt: Date.now(),
  };

  const writeBatch = db.bulkWriter();

  // add post to posts collection
  const postId = uuid();
  const postDoc = db.doc(`posts/${postId}`);
  writeBatch.set(postDoc, postData);

  // add post to follower feeds
  const followers = await db.collection(`follows/${requesterId}/from`).get();
  followers.docs.forEach((follower) => {
    const feedPost = db.doc(`users/${follower.id}/feed/${postId}`);
    writeBatch.set(feedPost, postData);
  });

  await writeBatch.close();
});

const updatePostSchema = z.object({
  postId: z.string(),
  updatedData: z.object({
    description: z.string().optional(),
  }),
});
export const updatePost = onCall(opts, async (req) => {
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Must be signed in to update post.",
    );
  }

  const requesterId = req.auth.uid;
  const { postId, updatedData } = parseValidatedData(req, updatePostSchema);

  const postDoc = db.doc(`posts/${postId}`);
  const postData = (await postDoc.get()).data();
  if (!postData) {
    throw new HttpsError("not-found", "Post does not exist.");
  }
  if (postData.userId !== requesterId) {
    throw new HttpsError("permission-denied", "Post is owned by another user.");
  }

  const writeBatch = db.bulkWriter();

  writeBatch.update(postDoc, updatedData);

  const followers = await db.collection(`follows/${requesterId}/from`).get();
  followers.docs.forEach((follower) => {
    const feedPost = db.doc(`users/${follower.id}/feed/${postId}`);
    writeBatch.update(feedPost, updatedData);
  });

  await writeBatch.close();
});

const deletePostSchema = z.object({
  postId: z.string(),
});
export const deletePost = onCall(opts, async (req) => {
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Must be signed in to delete post.",
    );
  }

  const requesterId = req.auth.uid;
  const { postId } = parseValidatedData(req, deletePostSchema);

  const postDoc = db.doc(`posts/${postId}`);
  const postData = (await postDoc.get()).data();
  if (!postData) {
    return;
  }
  if (postData.userId !== requesterId) {
    throw new HttpsError("permission-denied", "Post is owned by another user.");
  }

  const writeBatch = db.bulkWriter();

  writeBatch.delete(postDoc);

  const followers = await db.collection(`follows/${requesterId}/from`).get();
  followers.docs.forEach((follower) => {
    const feedPost = db.doc(`users/${follower.id}/feed/${postId}`);
    writeBatch.delete(feedPost);
  });

  await writeBatch.close();
});
