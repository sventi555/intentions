import { beforeEach, describe, expect, it } from "vitest";
import { clearDatabase, makeChangeSnap, makeSnap, wrap } from "../test-utils";
import { db } from "./app";
import {
  addPostToFeeds,
  deletePostFromFeeds,
  documentPath,
  updatePostInFeeds,
} from "./post";

const USER_IDS = {
  user1: "user-1",
  user2: "user-2",
};

const follow = { from: USER_IDS.user2, to: USER_IDS.user1 };

describe("post functions", () => {
  beforeEach(async () => {
    await clearDatabase();

    const writeBatch = db.bulkWriter();

    Object.entries(USER_IDS).forEach(([_, userId]) =>
      writeBatch.set(db.doc(`/users/${userId}`), { private: true }),
    );

    const followDoc = db.doc(`/follows/${follow.to}/from/${follow.from}`);
    writeBatch.set(followDoc, { status: "accepted" });

    await writeBatch.close();
  });

  describe("addPostToFeeds", () => {
    const addPostToFeedsWrap = wrap(addPostToFeeds);

    describe("when a post is created", () => {
      it("should add post to all follower feeds", async () => {
        const postId = "post-1";
        const postData = { userId: follow.to, description: "hello" };
        const snap = makeSnap(documentPath, { postId }, postData);

        await addPostToFeedsWrap(snap);

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
    const updatePostInFeedsWrap = wrap(updatePostInFeeds);

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
        const postDataAfter = { ...postDataBefore, description: "goodbye" };
        const snap = makeChangeSnap(
          documentPath,
          { postId },
          postDataBefore,
          postDataAfter,
        );

        await updatePostInFeedsWrap(snap);

        const feedPost = await db
          .doc(`/users/${follow.from}/feed/${postId}`)
          .get();
        expect(feedPost.data()).toEqual(postDataAfter);
      });
    });
  });

  describe("deletePostFromFeeds", () => {
    const deletePostFromFeedsWrap = wrap(deletePostFromFeeds);

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
        const snap = makeSnap(documentPath, { postId }, postData);

        await deletePostFromFeedsWrap(snap);

        const feedPost = await db
          .doc(`/users/${follow.from}/feed/${postId}`)
          .get();
        expect(feedPost.exists).toBeFalsy();
      });
    });
  });
});
