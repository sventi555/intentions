import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db, functionOpts } from "./app";

exports.followUser = onCall({ ...functionOpts }, async (req) => {
  // check if signed in
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Must be signed in to follow someone.",
    );
  }

  const requesterId = req.auth.uid;

  const followedUserId = req.data.userId;
  if (!followedUserId) {
    throw new HttpsError("invalid-argument", "Must specify userId to follow.");
  }

  // prevent from following self
  if (followedUserId === req.auth.uid) {
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
  writeBatch.set(followDoc, followData);

  // if status is immediately accepted (recipient is public), update feed
  if (!isPrivate) {
    const followedPosts = await db
      .collection("posts")
      .where("userId", "==", followedUserId)
      .get();

    followedPosts.forEach((post) => {
      const feedPostDoc = db.doc(`users/${requesterId}/feed/${post.id}`);
      writeBatch.set(feedPostDoc, post.data());
    });
  }

  await writeBatch.close();

  return followData;
});

exports.respondToFollow = onCall({ ...functionOpts }, async (req) => {
  // update the follow request to accepted (as long as it's pending) and
  // add the posts to requester's feed. Eventually send notification.

  // check if signed in
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Must be signed in to respond to a follow request.",
    );
  }

  const requesterId = req.auth.uid;

  const fromUserId = req.data.userId;
  if (!fromUserId) {
    throw new HttpsError(
      "invalid-argument",
      "Must specify userId to accept follow.",
    );
  }

  const { action } = req.data.action;
  if (!action) {
    throw new HttpsError(
      "invalid-argument",
      'Must specify action: "accept" or "decline".',
    );
  }

  const followDoc = db.doc(`follows/${requesterId}/from/${fromUserId}`);
  const followDocResource = await followDoc.get();
  if (!followDocResource.exists) {
    throw new HttpsError("not-found", "No follow request from this user.");
  }

  const followData = followDocResource.data()!;

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
      writeBatch.set(feedPostDoc, post.data());
    });
  } else {
    writeBatch.delete(followDoc);
  }

  await writeBatch.close();
});

exports.removeFollow = onCall({ ...functionOpts }, async (req) => {
  // check if signed in
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Must be signed in to remove a follow.",
    );
  }

  const requesterId = req.auth.uid;

  const { direction, userId } = req.data;
  if (!direction || !(direction === "from" || direction === "to")) {
    throw new HttpsError(
      "invalid-argument",
      'Must specify direction: "from" or "to".',
    );
  }
  if (!userId) {
    throw new HttpsError(
      "invalid-argument",
      "Must specify userId to remove follow.",
    );
  }

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
