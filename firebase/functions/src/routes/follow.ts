import {
  CallableOptions,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import { z } from "zod";
import { db, functionOpts } from "../app";
import { parseValidatedData } from "../validate";

const opts: CallableOptions = { ...functionOpts };

const followUserSchema = z.object({
  userId: z.string(),
});
export const followUser = onCall(opts, async (req) => {
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Must be signed in to follow someone.",
    );
  }

  const data = parseValidatedData(req, followUserSchema);

  const requesterId = req.auth.uid;
  const followedUserId = data.userId;

  // prevent from following self
  if (followedUserId === requesterId) {
    throw new HttpsError("invalid-argument", "Cannot follow yourself.");
  }

  // check for pre-existing follow
  const followDoc = db.doc(`follows/${followedUserId}/from/${requesterId}`);
  const followDocResource = await followDoc.get();
  if (followDocResource.exists) {
    throw new HttpsError(
      "already-exists",
      followDocResource.data()?.status === "pending"
        ? "Already requested to follow this user."
        : "Already following this user.",
    );
  }

  // get recipient privacy
  const recipient = await db.doc(`users/${followedUserId}`).get();
  if (!recipient.exists) {
    throw new HttpsError("not-found", "User does not exist.");
  }
  const isPrivate = recipient.data()?.private;

  const writeBatch = db.bulkWriter();

  // create follow
  const followData = {
    status: isPrivate ? "pending" : "accepted",
  };
  writeBatch.create(followDoc, followData);

  // if status is immediately accepted (recipient is public), update feed
  if (!isPrivate) {
    const followedPosts = await db
      .collection("posts")
      .where("userId", "==", followedUserId)
      .get();

    followedPosts.forEach((post) => {
      const feedPostDoc = db.doc(`users/${requesterId}/feed/${post.id}`);
      writeBatch.create(feedPostDoc, post.data());
    });
  }

  await writeBatch.close();

  return followData;
});

const respondToFollowSchema = z.object({
  userId: z.string(),
  action: z.enum(["accept", "decline"]),
});
export const respondToFollow = onCall(opts, async (req) => {
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Must be signed in to respond to a follow request.",
    );
  }

  const data = parseValidatedData(req, respondToFollowSchema);

  const requesterId = req.auth.uid;
  const { userId: fromUserId, action } = data;

  const followDoc = db.doc(`follows/${requesterId}/from/${fromUserId}`);
  const followData = (await followDoc.get()).data();
  if (!followData) {
    throw new HttpsError("not-found", "No follow request from this user.");
  }

  // bail out early if request has already been accepted
  if (followData.status === "accepted") {
    if (action === "decline") {
      throw new HttpsError(
        "failed-precondition",
        "Cannot decline a request that's already accepted. Delete it instead.",
      );
    }

    return;
  }

  const writeBatch = db.bulkWriter();

  if (action === "accept") {
    writeBatch.update(followDoc, { status: "accepted" });

    const followedPosts = await db
      .collection("posts")
      .where("userId", "==", requesterId)
      .get();

    followedPosts.forEach((post) => {
      const feedPostDoc = db.doc(`users/${fromUserId}/feed/${post.id}`);
      writeBatch.create(feedPostDoc, post.data());
    });
  } else {
    writeBatch.delete(followDoc);
  }

  await writeBatch.close();
});

const removeFollowSchema = z.object({
  direction: z.enum(["to", "from"]),
  userId: z.string(),
});
export const removeFollow = onCall(opts, async (req) => {
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Must be signed in to remove a follow.",
    );
  }

  const data = parseValidatedData(req, removeFollowSchema);

  const requesterId = req.auth.uid;
  const { direction, userId } = data;
  const fromUserId = direction === "from" ? userId : requesterId;
  const toUserId = direction === "from" ? requesterId : userId;

  const followDoc = db.doc(`follows/${toUserId}/from/${fromUserId}`);

  const writeBatch = db.bulkWriter();

  writeBatch.delete(followDoc);

  const followedPosts = await db
    .collection(`users/${fromUserId}/feed`)
    .where("userId", "==", toUserId)
    .get();

  followedPosts.forEach((post) => {
    writeBatch.delete(post.ref);
  });

  await writeBatch.close();
});
