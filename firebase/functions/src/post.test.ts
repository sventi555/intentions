import { getFirestore } from "firebase-admin/firestore";
import functionsTest from "firebase-functions-test";
import { beforeEach, describe, expect, it } from "vitest";
import { addPostToFeeds, deletePostFromFeeds, updatePostInFeeds } from "./post";

const test = functionsTest();

const db = getFirestore();

const USER_IDS = {
  user1: "user-1",
  user2: "user-2",
};

const follow = { from: USER_IDS.user2, to: USER_IDS.user1 };

describe("post functions", () => {
  beforeEach(async () => {
    const collections = await db.listCollections();
    const deletePromises = collections.map((c) => db.recursiveDelete(c));

    await Promise.all(deletePromises);

    const writeBatch = db.bulkWriter();

    Object.entries(USER_IDS).forEach(([_, userId]) =>
      writeBatch.set(db.doc(`/users/${userId}`), { private: true }),
    );

    const followDoc = db.doc(`/follows/${follow.to}/from/${follow.from}`);
    writeBatch.set(followDoc, { status: "accepted" });

    await writeBatch.close();
  });

  describe("addPostToFeeds", () => {
    const addPostToFeedsWrap = test.wrap(addPostToFeeds);

    describe("when a post is created", () => {
      beforeEach(async () => {});

      it("should add post to all follower feeds", async () => {
        const postId = "post-1";
        const postData = { userId: follow.to, description: "hello" };
        const snap = test.firestore.makeDocumentSnapshot(
          postData,
          `/posts/${postId}`,
        );

        await addPostToFeedsWrap({ data: snap });

        const feedPost = await db
          .doc(`/users/${follow.from}/feed/${postId}`)
          .get();
        expect(feedPost.data()).toEqual(postData);

        const user1Feed = await db.collection(`/users/${follow.to}/feed`).get();
        expect(user1Feed.size).toEqual(0);
      });
    });
  });

  describe("updatePostInFeeds", () => {
    const updatePostInFeedsWrap = test.wrap(updatePostInFeeds);

    describe("when a post is updated", () => {
      const postId = "post-1";
      const postDataBefore = { userId: follow.to, description: "hello" };

      beforeEach(async () => {
        const writeBatch = db.bulkWriter();

        const post = db.doc(`/posts/${postId}`);
        writeBatch.set(post, postDataBefore);

        const feedPost = db.doc(`/users/${follow.from}/feed/${postId}`);
        writeBatch.set(feedPost, postDataBefore);

        await writeBatch.close();
      });

      it("should update post in all follower feeds", async () => {
        const before = test.firestore.makeDocumentSnapshot(
          postDataBefore,
          `/posts/${postId}`,
        );

        const postDataAfter = { ...postDataBefore, description: "goodbye" };
        const after = test.firestore.makeDocumentSnapshot(
          postDataAfter,
          `/posts/${postId}`,
        );

        await updatePostInFeedsWrap({ data: test.makeChange(before, after) });

        const feedPost = await db
          .doc(`/users/${follow.from}/feed/${postId}`)
          .get();
        expect(feedPost.data()).toEqual(postDataAfter);
      });
    });
  });

  describe("deletePostFromFeeds", () => {
    const deletePostFromFeedsWrap = test.wrap(deletePostFromFeeds);

    describe("when a post is deleted", () => {
      const postId = "post-1";
      const postData = { userId: follow.to, description: "hello" };

      beforeEach(async () => {
        const writeBatch = db.bulkWriter();

        const post = db.doc(`/posts/${postId}`);
        writeBatch.set(post, postData);

        const feedPost = db.doc(`/users/${follow.from}/feed/${postId}`);
        writeBatch.set(feedPost, postData);

        await writeBatch.close();
      });

      it("should delete post from all follower feeds", async () => {
        const snap = test.firestore.makeDocumentSnapshot(
          postData,
          `/posts/${postId}`,
        );

        await deletePostFromFeedsWrap({ data: snap });

        const feedPost = await db
          .doc(`/users/${follow.from}/feed/${postId}`)
          .get();
        expect(feedPost.exists).toBeFalsy();
      });
    });
  });
});
