import {
  DocumentOptions,
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentUpdated,
} from "firebase-functions/firestore";
import { db, functionOpts } from "./app";

export const documentPath = "/follows/{toUserId}/from/{fromUserId}";
const opts: DocumentOptions<typeof documentPath> = {
  ...functionOpts,
  document: documentPath,
};

export const addPublicFollowPostsToFeed = onDocumentCreated(
  opts,
  async (event) => {
    const follow = event.data;

    if (!follow || follow.data().status !== "accepted") {
      return;
    }

    const { toUserId, fromUserId } = event.params;

    const toUserPosts = await db
      .collection("posts")
      .where("userId", "==", toUserId)
      .get();

    const writeBatch = db.bulkWriter();
    toUserPosts.forEach((post) => {
      const feedPostDoc = db.doc(`/users/${fromUserId}/feed/${post.id}`);
      writeBatch.set(feedPostDoc, post.data());
    });

    await writeBatch.close();
  },
);

export const addPrivateFollowPostsToFeed = onDocumentUpdated(
  opts,
  async (event) => {
    const follow = event.data;

    if (!follow || follow.after.data().status !== "accepted") {
      return;
    }

    const { toUserId, fromUserId } = event.params;

    const toUserPosts = await db
      .collection("posts")
      .where("userId", "==", toUserId)
      .get();

    const writeBatch = db.bulkWriter();
    toUserPosts.forEach((post) => {
      const feedPostDoc = db.doc(`/users/${fromUserId}/feed/${post.id}`);
      writeBatch.set(feedPostDoc, post.data());
    });

    await writeBatch.close();
  },
);

export const removeFollowPostsFromFeed = onDocumentDeleted(
  opts,
  async (event) => {
    const follow = event.data;

    if (!follow) {
      return;
    }

    const { toUserId, fromUserId } = event.params;

    const toUserPosts = await db
      .collection("posts")
      .where("userId", "==", toUserId)
      .get();

    const writeBatch = db.bulkWriter();
    toUserPosts.forEach((post) => {
      const feedPostDoc = db.doc(`/users/${fromUserId}/feed/${post.id}`);
      writeBatch.delete(feedPostDoc);
    });

    await writeBatch.close();
  },
);
