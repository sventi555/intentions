import { onCall } from "firebase-functions/v2/https";
import { functionOpts } from "./app";

export const addPost = onCall({ ...functionOpts }, async (req) => {});

//import { Firestore } from "firebase-admin/firestore";
//import {
//  DocumentOptions,
//  onDocumentCreated,
//  onDocumentDeleted,
//  onDocumentUpdated,
//} from "firebase-functions/v2/firestore";
//import { db, functionOpts } from "./app";
//
//export const postDocumentPath = "/posts/{postId}";
//const opts: DocumentOptions<typeof postDocumentPath> = {
//  ...functionOpts,
//  document: postDocumentPath,
//};
//
//export const addPostToFeeds = onDocumentCreated(opts, async (event) => {
//  const post = event.data;
//
//  if (!post) {
//    return;
//  }
//
//  const postId = post.id;
//  const postData = post.data();
//  const authorId = postData.userId;
//
//  const followerIds = await getFollowerIds(db, authorId);
//
//  const writeBatch = db.bulkWriter();
//  followerIds.forEach((followerId) => {
//    const feedPostDoc = db.doc(`/users/${followerId}/feed/${postId}`);
//    writeBatch.set(feedPostDoc, postData);
//  });
//
//  await writeBatch.close();
//});
//
//export const updatePostInFeeds = onDocumentUpdated(opts, async (event) => {
//  const post = event.data;
//
//  if (!post) {
//    return;
//  }
//
//  const postId = post.after.id;
//  const postData = post.after.data();
//  const authorId = postData.userId;
//
//  const followerIds = await getFollowerIds(db, authorId);
//
//  const writeBatch = db.bulkWriter();
//  followerIds.forEach((followerId) => {
//    const feedPostDoc = db.doc(`/users/${followerId}/feed/${postId}`);
//    writeBatch.update(feedPostDoc, postData);
//  });
//
//  await writeBatch.close();
//});
//
//export const deletePostFromFeeds = onDocumentDeleted(opts, async (event) => {
//  const post = event.data;
//
//  if (!post) {
//    return;
//  }
//
//  const postId = post.id;
//  const postData = post.data();
//  const authorId = postData.userId;
//
//  const followerIds = await getFollowerIds(db, authorId);
//
//  const writeBatch = db.bulkWriter();
//  followerIds.forEach((followerId) => {
//    const feedPostDoc = db.doc(`/users/${followerId}/feed/${postId}`);
//    writeBatch.delete(feedPostDoc);
//  });
//
//  await writeBatch.close();
//});
//
//const getFollowerIds = async (db: Firestore, authorId: string) => {
//  const followingAuthor = await db
//    .collection(`follows/${authorId}/from`)
//    .where("status", "==", "accepted")
//    .select()
//    .get();
//
//  return followingAuthor.docs.map((d) => d.id);
//};
