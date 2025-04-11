import { beforeEach, describe, expect, it } from "vitest";
import { clearDatabase, makeChangeSnap, makeSnap, wrap } from "../test-utils";
import { db } from "./app";
import {
  addPrivateFollowPostsToFeed,
  addPublicFollowPostsToFeed,
  documentPath,
  removeFollowPostsFromFeed,
} from "./follow";

const USER_IDS = {
  user1: "user-1",
  user2: "user-2",
};

const follow = { from: USER_IDS.user2, to: USER_IDS.user1 };
const posts = {
  "post-1": { userId: follow.to, description: "post 1" },
  "post-2": { userId: follow.to, description: "post 2" },
};

describe("follow functions", () => {
  beforeEach(async () => {
    await clearDatabase();

    const writeBatch = db.bulkWriter();

    Object.entries(posts).forEach(([postId, post]) => {
      writeBatch.set(db.doc(`/posts/${postId}`), post);
    });

    await writeBatch.close();
  });

  describe("addPublicFollowPostsToFeed", () => {
    const addPublicFollowPostsWrap = wrap(addPublicFollowPostsToFeed);

    describe("when a follow is accepted", () => {
      it("should add all posts to follower feed", async () => {
        const snap = makeSnap(
          documentPath,
          { toUserId: follow.to, fromUserId: follow.from },
          { status: "accepted" },
        );
        await addPublicFollowPostsWrap(snap);

        const followerFeed = await db
          .collection(`/users/${follow.from}/feed`)
          .get();
        expect(followerFeed.size).toEqual(Object.keys(posts).length);

        const followedFeed = await db
          .collection(`/users/${follow.to}/feed`)
          .get();
        expect(followedFeed.size).toEqual(0);
      });
    });

    describe("when a follow is pending", () => {
      it("should not add posts to feed", async () => {
        const snap = makeSnap(
          documentPath,
          { toUserId: follow.to, fromUserId: follow.from },
          { status: "pending" },
        );
        await addPublicFollowPostsWrap(snap);

        const followerFeed = await db
          .collection(`/users/${follow.from}/feed`)
          .get();
        expect(followerFeed.size).toEqual(0);
      });
    });
  });

  describe("addPrivateFollowPostsToFeed", () => {
    const addPrivateFollowPostsWrap = wrap(addPrivateFollowPostsToFeed);

    describe("when a follow is updated to accepted", () => {
      it("should add all posts to follower feed", async () => {
        const snap = makeChangeSnap(
          documentPath,
          { toUserId: follow.to, fromUserId: follow.from },
          { status: "pending" },
          { status: "accepted" },
        );
        await addPrivateFollowPostsWrap(snap);

        const followerFeed = await db
          .collection(`/users/${follow.from}/feed`)
          .get();
        expect(followerFeed.size).toEqual(Object.keys(posts).length);
      });
    });
  });

  describe("removeFollowPostsFromFeed", () => {
    const removeFollowPostsWrap = wrap(removeFollowPostsFromFeed);

    describe("when someone unfollows (deletes a follow)", () => {
      beforeEach(async () => {
        const writeBatch = db.bulkWriter();
        Object.entries(posts).forEach(([postId, post]) => {
          const feedDoc = db.doc(`/users/${follow.from}/feed/${postId}`);
          writeBatch.set(feedDoc, post);
        });

        await writeBatch.close();
      });

      it("should remove all posts from follower feed", async () => {
        const feedCollection = `/users/${follow.from}/feed`;

        const followerFeedBefore = await db.collection(feedCollection).get();
        expect(followerFeedBefore.size).toEqual(Object.keys(posts).length);

        const snap = makeSnap(
          documentPath,
          { toUserId: follow.to, fromUserId: follow.from },
          { status: "accepted" },
        );
        await removeFollowPostsWrap(snap);

        const feedAfter = await db.collection(feedCollection).get();
        expect(feedAfter.size).toEqual(0);
      });
    });
  });
});
