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
  privateUser: "privateUser",
  publicUser: "publicUser",
};

const testUsers = {
  [USER_IDS.authUser]: { username: "booga", private: true },
  [USER_IDS.privateUser]: { username: "private-user", private: true },
  [USER_IDS.publicUser]: { username: "public-user", private: false },
};

const STATUS = { accepted: "accepted", pending: "pending" };

interface Post {
  userId: string;
  user: any;
  intentionId: string;
  intention: any;
  createdAt: number;
  description?: string;
  imageUrl?: string;
}

const mockPost: Post = {
  userId: "",
  user: {},
  intentionId: "",
  intention: {},
  createdAt: 0,
};

const followDocPath = (from: string, to: string) =>
  `follows/${to}/from/${from}`;
const postDocPath = (id: string) => `posts/${id}`;

const addPostWithoutRules = async (
  testEnv: RulesTestEnvironment,
  post: Post,
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

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe("read", () => {
    // ALLOWED
    describe("requester owns post", () => {
      let postId: string = "";

      beforeEach(async () => {
        postId = await addPostWithoutRules(testEnv, {
          ...mockPost,
          userId: USER_IDS.authUser,
        });
      });

      it("should allow reading ", async () => {
        const db = authContext.firestore();

        const postDoc = doc(db, postDocPath(postId));
        await assertSucceeds(getDoc(postDoc));
      });
    });

    describe("post owner is public", () => {
      let postId: string;

      beforeEach(async () => {
        postId = await addPostWithoutRules(testEnv, {
          ...mockPost,
          userId: USER_IDS.publicUser,
        });
      });

      it("should allow reading post", async () => {
        const db = authContext.firestore();

        const postDoc = doc(db, postDocPath(postId));
        await assertSucceeds(getDoc(postDoc));
      });
    });

    describe("requester follows post owner", () => {
      let postId: string;

      beforeEach(async () => {
        postId = await addPostWithoutRules(testEnv, {
          ...mockPost,
          userId: USER_IDS.privateUser,
        });
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const db = context.firestore();

          const followDoc = doc(
            db,
            followDocPath(USER_IDS.authUser, USER_IDS.privateUser),
          );
          await setDoc(followDoc, { status: STATUS.accepted });
        });
      });

      it("should allow reading post", async () => {
        const db = authContext.firestore();

        const postDoc = doc(db, postDocPath(postId));
        await assertSucceeds(getDoc(postDoc));
      });
    });

    // NOT ALLOWED
    describe("owner is private", () => {
      let postId: string;

      beforeEach(async () => {
        postId = await addPostWithoutRules(testEnv, {
          ...mockPost,
          userId: USER_IDS.privateUser,
        });
      });

      it("should not allow reading when authenticated", async () => {
        const db = authContext.firestore();

        const postDoc = doc(db, postDocPath(postId));
        await assertFails(getDoc(postDoc));
      });

      it("should not allow reading when unauthenticated", async () => {
        const db = unauthContext.firestore();

        const postDoc = doc(db, postDocPath(postId));
        await assertFails(getDoc(postDoc));
      });
    });

    describe("private owner follows me, but I don't follow them", () => {
      let postId: string;

      beforeEach(async () => {
        postId = await addPostWithoutRules(testEnv, {
          ...mockPost,
          userId: USER_IDS.privateUser,
        });
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const db = context.firestore();

          const followDoc = doc(
            db,
            followDocPath(USER_IDS.privateUser, USER_IDS.authUser),
          );
          await setDoc(followDoc, { status: STATUS.accepted });
        });
      });

      it("should not allow reading post", async () => {
        const db = authContext.firestore();

        const postDoc = doc(db, postDocPath(postId));
        await assertFails(getDoc(postDoc));
      });
    });
  });
});
