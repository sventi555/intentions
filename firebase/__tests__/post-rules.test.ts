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
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  setLogLevel,
  updateDoc,
} from "firebase/firestore";
import fs from "node:fs";
import path from "node:path";
import { beforeAll, beforeEach, describe, it } from "vitest";

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

const mockPost = {
  userId: "",
  intentionId: "abcd",
  createdAt: 1234,
  description: "i did a thing",
};

const followDocPath = (from: string, to: string) => `follows/${from}/to/${to}`;
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
  });

  describe("create", () => {
    // ALLOWED
    it("should allow creating a post with requester id", async () => {
      const db = authContext.firestore();

      await assertSucceeds(
        addDoc(collection(db, "posts"), {
          ...mockPost,
          userId: USER_IDS.authUser,
        }),
      );
    });

    // NOT ALLOWED
    it("should not allow creating a post without auth", async () => {
      const db = unauthContext.firestore();

      await assertFails(
        addDoc(collection(db, "posts"), {
          ...mockPost,
          userId: USER_IDS.authUser,
        }),
      );
    });

    it("should not allow creating a post with different owner", async () => {
      const db = authContext.firestore();

      await assertFails(
        addDoc(collection(db, "posts"), {
          ...mockPost,
          userId: USER_IDS.publicUser,
        }),
      );
    });

    it("should not allow creating a post with no description and image", async () => {
      const db = authContext.firestore();

      await assertFails(
        addDoc(collection(db, "posts"), {
          userId: USER_IDS.authUser,
          intentionId: "abcd",
          createdAt: 1234,
        }),
      );
    });
  });

  describe("update", () => {
    // ALLOWED
    describe("requester owns post", () => {
      let postId: string;

      beforeEach(async () => {
        postId = await addPostWithoutRules(testEnv, {
          ...mockPost,
          userId: USER_IDS.authUser,
        });
      });

      it("should allow updating description", async () => {
        const db = authContext.firestore();

        const postDoc = doc(db, postDocPath(postId));
        await assertSucceeds(
          updateDoc(postDoc, { description: "new description" }),
        );
      });

      // NOT ALLOWED
      it("should not allow updating other fields", async () => {
        const db = authContext.firestore();

        const postDoc = doc(db, postDocPath(postId));
        await assertFails(
          updateDoc(postDoc, {
            userId: "new-id",
            createdAt: 5678,
            imageUrl: "https://new-url.com",
            intentionId: "new-intention-id",
          }),
        );
      });
    });

    describe("requester does not own post", () => {
      let postId: string;

      beforeEach(async () => {
        postId = await addPostWithoutRules(testEnv, {
          ...mockPost,
          userId: USER_IDS.publicUser,
        });
      });

      it("should not allow updating when signed in", async () => {
        const db = authContext.firestore();

        const postDoc = doc(db, postDocPath(postId));
        await assertFails(
          updateDoc(postDoc, { description: "new description" }),
        );
      });

      it("should not allow updating when unauthenticated", async () => {
        const db = unauthContext.firestore();

        const postDoc = doc(db, postDocPath(postId));
        await assertFails(
          updateDoc(postDoc, { description: "new description" }),
        );
      });
    });
  });

  describe("delete", () => {
    // ALLOWED
    describe("requester owns post", () => {
      let postId: string;

      beforeEach(async () => {
        postId = await addPostWithoutRules(testEnv, {
          ...mockPost,
          userId: USER_IDS.authUser,
        });
      });

      it("should allow deletion", async () => {
        const db = authContext.firestore();

        const postDoc = doc(db, postDocPath(postId));
        await assertSucceeds(deleteDoc(postDoc));
      });
    });

    // NOT ALLOWED
    describe("requester does not own post", () => {
      let postId: string;

      beforeEach(async () => {
        postId = await addPostWithoutRules(testEnv, {
          ...mockPost,
          userId: USER_IDS.publicUser,
        });
      });

      it("should not allow deleting when signed in", async () => {
        const db = authContext.firestore();

        const postDoc = doc(db, postDocPath(postId));
        await assertFails(deleteDoc(postDoc));
      });

      it("should not allow deleting when unauthenticated", async () => {
        const db = unauthContext.firestore();

        const postDoc = doc(db, postDocPath(postId));
        await assertFails(deleteDoc(postDoc));
      });
    });
  });
});
