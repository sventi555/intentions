import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

initializeApp();

console.log("bunger");

exports.addPostToFeed = onDocumentCreated("/posts/{postId}", async (event) => {
  const post = event.data?.data();

  if (!post) {
    return;
  }

  const authorId = post.userId;

  const followingAuthor = await getFirestore()
    .collection(`follows/${authorId}/from`)
    .where("status", "==", "accepted")
    .select()
    .get();

  const followerIds = followingAuthor.docs.map((d) => d.id);
  logger.debug(followerIds);
});
