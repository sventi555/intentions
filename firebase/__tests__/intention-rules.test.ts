import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestContext,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import fs from "node:fs";
import path from "node:path";
import { beforeEach, it, beforeAll, describe } from "vitest";
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

const followDocPath = (fromId: string, toId: string) =>
  `follows/${fromId}/to/${toId}`;

const intentionDocPath = (id: string) => `intentions/${id}`;

const addIntentionWithoutRules = async (
  testEnv: RulesTestEnvironment,
  { userId, name }: { userId: string; name: string },
) => {
  let intentionId: string = "";

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    const intentionDoc = await addDoc(collection(db, "intentions"), {
      userId,
      name,
    });
    intentionId = intentionDoc.id;
  });

  return intentionId;
};

describe("intention rules", () => {
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
    describe("requester owns intention", () => {
      let intentionId: string;

      beforeEach(async () => {
        intentionId = await addIntentionWithoutRules(testEnv, {
          userId: USER_IDS.authUser,
          name: "cook grub",
        });
      });

      it("should allow reading intention", async () => {
        const db = authContext.firestore();

        const intentionDoc = doc(db, intentionDocPath(intentionId));
        await assertSucceeds(getDoc(intentionDoc));
      });
    });

    describe("intention owner is public", () => {
      let intentionId: string;

      beforeEach(async () => {
        intentionId = await addIntentionWithoutRules(testEnv, {
          userId: USER_IDS.publicUser,
          name: "cook grub",
        });
      });

      it("should allow reading intention", async () => {
        const db = authContext.firestore();

        const intentionDoc = doc(db, intentionDocPath(intentionId));
        await assertSucceeds(getDoc(intentionDoc));
      });
    });

    describe("requester follows intention owner", () => {
      let intentionId: string;

      beforeEach(async () => {
        intentionId = await addIntentionWithoutRules(testEnv, {
          userId: USER_IDS.privateUser,
          name: "cook grub",
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

      it("should allow reading intention", async () => {
        const db = authContext.firestore();

        const intentionDoc = doc(db, intentionDocPath(intentionId));
        await assertSucceeds(getDoc(intentionDoc));
      });
    });

    // NOT ALLOWED
    describe("owner is private", () => {
      let intentionId: string;

      beforeEach(async () => {
        intentionId = await addIntentionWithoutRules(testEnv, {
          userId: USER_IDS.privateUser,
          name: "cook grub",
        });
      });

      it("should not allow reading when authenticated", async () => {
        const db = authContext.firestore();

        const intentionDoc = doc(db, intentionDocPath(intentionId));
        await assertFails(getDoc(intentionDoc));
      });

      it("should not allow reading when unauthenticated", async () => {
        const db = unauthContext.firestore();

        const intentionDoc = doc(db, intentionDocPath(intentionId));
        await assertFails(getDoc(intentionDoc));
      });
    });
  });

  describe("create", () => {
    // ALLOWED
    it("should allow creating an intention with requester id", async () => {
      const db = authContext.firestore();

      await assertSucceeds(
        addDoc(collection(db, "intentions"), {
          userId: USER_IDS.authUser,
          name: "Cook grub",
        }),
      );
    });

    // NOT ALLOWED
    it("should not allow creating an intention without auth", async () => {
      const db = unauthContext.firestore();

      await assertFails(
        addDoc(collection(db, "intentions"), {
          userId: USER_IDS.authUser,
          name: "Cook grub",
        }),
      );
    });

    it("should not allow creating an intention with different owner", async () => {
      const db = authContext.firestore();

      await assertFails(
        addDoc(collection(db, "intentions"), {
          userId: USER_IDS.publicUser,
          name: "Cook grub",
        }),
      );
    });
  });

  describe("update", () => {
    // ALLOWED
    describe("requester owns intention", () => {
      let intentionId: string;

      beforeEach(async () => {
        intentionId = await addIntentionWithoutRules(testEnv, {
          userId: USER_IDS.authUser,
          name: "cook grub",
        });
      });

      it("should allow updating name", async () => {
        const db = authContext.firestore();

        const intentionDoc = doc(db, intentionDocPath(intentionId));
        await assertSucceeds(updateDoc(intentionDoc, { name: "new name" }));
      });

      // NOT ALLOWED
      it("should not allow updating userId", async () => {
        const db = authContext.firestore();

        const intentionDoc = doc(db, intentionDocPath(intentionId));
        await assertFails(
          updateDoc(intentionDoc, { userId: USER_IDS.publicUser }),
        );
      });
    });

    describe("requester does not own intention", () => {
      let intentionId: string;

      beforeEach(async () => {
        intentionId = await addIntentionWithoutRules(testEnv, {
          userId: USER_IDS.publicUser,
          name: "cook grub",
        });
      });

      it("should not allow updating intention when signed in", async () => {
        const db = authContext.firestore();

        const intentionDoc = doc(db, intentionDocPath(intentionId));
        await assertFails(updateDoc(intentionDoc, { name: "new name" }));
      });

      it("should not allow updating intention when unauthenticated", async () => {
        const db = unauthContext.firestore();

        const intentionDoc = doc(db, intentionDocPath(intentionId));
        await assertFails(updateDoc(intentionDoc, { name: "new name" }));
      });
    });
  });

  describe("delete", () => {
    // ALLOWED
    describe("requester owns intention", () => {
      let intentionId: string;

      beforeEach(async () => {
        intentionId = await addIntentionWithoutRules(testEnv, {
          userId: USER_IDS.authUser,
          name: "cook grub",
        });
      });

      it("should allow deleting", () => {});
    });

    // NOT ALLOWED
    describe("requester does not own intention", () => {
      let intentionId: string;

      beforeEach(async () => {
        intentionId = await addIntentionWithoutRules(testEnv, {
          userId: USER_IDS.publicUser,
          name: "cook grub",
        });
      });

      it("should not allow deleting when signed in", async () => {
        const db = authContext.firestore();

        const intentionDoc = doc(db, intentionDocPath(intentionId));
        await assertFails(deleteDoc(intentionDoc));
      });

      it("should not allow deleting when unauthenticated", async () => {
        const db = unauthContext.firestore();

        const intentionDoc = doc(db, intentionDocPath(intentionId));
        await assertFails(deleteDoc(intentionDoc));
      });
    });
  });
});
