import {
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestContext,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { addDoc, collection, doc, getDoc, setDoc } from "firebase/firestore";
import fs from "node:fs";
import path from "node:path";
import { beforeAll, beforeEach, describe, it } from "vitest";

const USER_IDS = {
  authUser: "authUser",
  privateUser: "privateUser",
  publicUser: "publicUser",
};

const testUsers = {
  [USER_IDS.authUser]: { username: "booga", private: true },
  [USER_IDS.privateUser]: { username: "private-user", private: true },
  [USER_IDS.publicUser]: { username: "public-user", private: false },
};

const STATUS = { accepted: "accepted", pending: "pending" };

const postDocPath = (id: string) => `posts/${id}`;

const addPostWithoutRules = async (
  testEnv: RulesTestEnvironment,
  post: {
    userId: string;
    intentionId: string;
    createdAt: number;
    imageUrl?: string;
    description?: string;
  },
) => {
  let postId: string = "";

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    const postDoc = await addDoc(collection(db, "posts"), post);
    postId = postDoc.id;
  });

  return postId;
};

describe("post rules", () => {
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

  describe("read", () => {
    // ALLOWED
    describe("requester owns post", () => {
      let postId: string = "";

      beforeEach(async () => {
        postId = await addPostWithoutRules(testEnv, {
          userId: USER_IDS.authUser,
          createdAt: Date.now(),
          intentionId: "abcd",
          description: "i did good",
        });
      });

      it("should allow reading ", async () => {
        const db = authContext.firestore();

        const postDoc = doc(db, postDocPath(postId));
        await assertSucceeds(getDoc(postDoc));
      });
    });
  });
});
