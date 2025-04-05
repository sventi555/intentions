import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

initializeApp();

exports.addPostToFeed = onDocumentCreated(
  // Represent the hometown
  { document: "/posts/{postId}", region: "northamerica-northeast2" },
  async (event) => {
    const post = event.data;

    if (!post) {
      return;
    }

    const db = getFirestore();

    const postId = post.id;
    const postData = post.data();

    const authorId = postData.userId;

    const followingAuthor = await db
      .collection(`follows/${authorId}/from`)
      .where("status", "==", "accepted")
      .select()
      .get();

    const followerIds = followingAuthor.docs.map((d) => d.id);

    const writeBatch = db.bulkWriter();
    followerIds.forEach((followerId) => {
      const feedPostDoc = db.doc(`/users/${followerId}/feed/${postId}`);
      writeBatch.set(feedPostDoc, postData);
    });

    await writeBatch.close();
  },
);
