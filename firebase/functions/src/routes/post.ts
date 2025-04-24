import {
  CallableOptions,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import mime from "mime-types";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { db, functionOpts, storage } from "../app";
import { parseValidatedData } from "../validate";

const opts: CallableOptions = { ...functionOpts };

const addPostSchema = z
  .object({
    intentionId: z.string(),
    image: z.string().optional(), // base64 string
    description: z.string().optional(),
  })
  .refine(({ image, description }) => image || description, {
    message: "Image or description must be provided.",
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

  let imageFileName: string | undefined = undefined;
  if (data.image) {
    const [imageMeta, image] = data.image.split(",");

    const contentType = imageMeta.match(/data:(.*);base64/)?.[1];
    if (!contentType) {
      throw new HttpsError("invalid-argument", "Mime type missing.");
    }

    const [mimeType] = contentType.split("/");
    if (!(mimeType === "image" || mimeType === "video")) {
      throw new HttpsError(
        "invalid-argument",
        "Mime type must be image or video.",
      );
    }

    const extension = mime.extension(contentType);
    if (!extension) {
      throw new HttpsError("invalid-argument", "Invalid mime type provided.");
    }

    const bucket = storage.bucket();

    const imageId = uuid();
    imageFileName = `posts/${imageId}.${extension}`;
    await bucket.file(imageFileName).save(image);
  }

  const postData = {
    userId: requesterId,
    user: { username: userData.username },
    intentionId: data.intentionId,
    intention: { name: intentionData.name },
    createdAt: Date.now(),
    ...(data.description ? { description: data.description } : {}),
    ...(imageFileName ? { image: imageFileName } : {}),
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

  // add post to own feed
  const ownFeedPost = db.doc(`users/${requesterId}/feed/${postId}`);
  writeBatch.set(ownFeedPost, postData);

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

  const ownFeedPost = db.doc(`users/${requesterId}/feed/${postId}`);
  writeBatch.update(ownFeedPost, updatedData);

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

  const ownFeedPost = db.doc(`users/${requesterId}/feed/${postId}`);
  writeBatch.delete(ownFeedPost);

  await writeBatch.close();
});
