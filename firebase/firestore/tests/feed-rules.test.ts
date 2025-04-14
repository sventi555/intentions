import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestContext,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  setDoc,
  setLogLevel,
} from "firebase/firestore";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

setLogLevel("silent");

const USER_IDS = {
  authUser: "authUser",
  publicUser: "publicUser",
};

const testUsers = {
  [USER_IDS.authUser]: { username: "auth-user", private: true },
  [USER_IDS.publicUser]: { username: "public-user", private: false },
};

const feedPostDocPath = (userId: string, postId: string) =>
  `/users/${userId}/feed/${postId}`;

const addFeedPostWithoutRules = async (
  testEnv: RulesTestEnvironment,
  post: { userId: string },
) => {
  let feedPostId: string = "";

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    const feedPostDoc = await addDoc(
      collection(db, `users/${post.userId}/feed`),
      post,
    );
    feedPostId = feedPostDoc.id;
  });

  return feedPostId;
};

describe("feed rules", () => {
  let testEnv: RulesTestEnvironment;

  let authContext: RulesTestContext;
  let unauthContext: RulesTestContext;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "intentions-test",
      firestore: {
        rules: fs.readFileSync(
          path.join(__dirname, "../firestore.rules"),
          "utf8",
        ),
        host: "127.0.0.1",
        port: 8080,
      },
    });

    authContext = testEnv.authenticatedContext(USER_IDS.authUser);
    unauthContext = testEnv.unauthenticatedContext();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      for (const userId in testUsers) {
        const userDoc = doc(db, "users", userId);
        await setDoc(userDoc, testUsers[userId]);
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe("read", () => {
    describe("when the requester owns the feed", () => {
      let postId: string = "";

      beforeEach(async () => {
        postId = await addFeedPostWithoutRules(testEnv, {
          userId: USER_IDS.authUser,
        });
      });

      it("should allow reading", async () => {
        const db = authContext.firestore();

        const feedPostDoc = doc(db, feedPostDocPath(USER_IDS.authUser, postId));
        await assertSucceeds(getDoc(feedPostDoc));
      });
    });

    describe("when requester is not the owner", () => {
      let postId: string = "";
      const postUser = USER_IDS.publicUser;

      beforeEach(async () => {
        postId = await addFeedPostWithoutRules(testEnv, {
          userId: postUser,
        });
      });

      it("should not allow reading as unauthenticated", async () => {
        const db = unauthContext.firestore();

        const feedPostDoc = doc(db, feedPostDocPath(postUser, postId));
        await assertFails(getDoc(feedPostDoc));
      });

      it("should not allow reading as non-owner user", async () => {
        const db = authContext.firestore();

        const feedPostDoc = doc(db, feedPostDocPath(postUser, postId));
        await assertFails(getDoc(feedPostDoc));
      });
    });
  });
});
