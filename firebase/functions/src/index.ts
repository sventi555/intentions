import { initializeApp } from "firebase-admin/app";
import { Firestore, getFirestore } from "firebase-admin/firestore";
import {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";

const functionOpts = { region: "northamerica-northeast2" };

initializeApp();

export const addPostToFeeds = onDocumentCreated(
  // Represent the hometown
  { ...functionOpts, document: "/posts/{postId}" },
  async (event) => {
    const post = event.data;

    if (!post) {
      return;
    }

    const db = getFirestore();

    const postId = post.id;
    const postData = post.data();
    const authorId = postData.userId;

    const followerIds = await getFollowerIds(db, authorId);

    const writeBatch = db.bulkWriter();
    followerIds.forEach((followerId) => {
      const feedPostDoc = db.doc(`/users/${followerId}/feed/${postId}`);
      writeBatch.set(feedPostDoc, postData);
    });

    await writeBatch.close();
  },
);

export const updateFeedPosts = onDocumentUpdated(
  {
    ...functionOpts,
    document: "/posts/{postId}",
  },
  async (event) => {
    const post = event.data;

    if (!post) {
      return;
    }

    const db = getFirestore();

    const postId = post.after.id;
    const postData = post.after.data();
    const authorId = postData.userId;

    const followerIds = await getFollowerIds(db, authorId);

    const writeBatch = db.bulkWriter();
    followerIds.forEach((followerId) => {
      const feedPostDoc = db.doc(`/users/${followerId}/feed/${postId}`);
      writeBatch.update(feedPostDoc, postData);
    });

    await writeBatch.close();
  },
);

export const deleteFeedPosts = onDocumentDeleted(
  { ...functionOpts, document: "/posts/{postId}" },
  async (event) => {
    const post = event.data;

    if (!post) {
      return;
    }

    const db = getFirestore();

    const postId = post.id;
    const postData = post.data();
    const authorId = postData.userId;

    const followerIds = await getFollowerIds(db, authorId);

    const writeBatch = db.bulkWriter();
    followerIds.forEach((followerId) => {
      const feedPostDoc = db.doc(`/users/${followerId}/feed/${postId}`);
      writeBatch.delete(feedPostDoc);
    });

    await writeBatch.close();
  },
);

const getFollowerIds = async (db: Firestore, authorId: string) => {
  const followingAuthor = await db
    .collection(`follows/${authorId}/from`)
    .where("status", "==", "accepted")
    .select()
    .get();

  return followingAuthor.docs.map((d) => d.id);
};
