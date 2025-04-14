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

const followDocPath = (fromId: string, toId: string) =>
  `follows/${toId}/from/${fromId}`;

const intentionDocPath = (id: string) => `intentions/${id}`;

const addIntentionWithoutRules = async (
  testEnv: RulesTestEnvironment,
  intention: { userId: string; name: string },
) => {
  let intentionId: string = "";

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    const intentionDoc = await addDoc(collection(db, "intentions"), intention);
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

  afterAll(async () => {
    await testEnv.cleanup();
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

    describe("private owner follows me, but I don't follow them", () => {
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
            followDocPath(USER_IDS.privateUser, USER_IDS.authUser),
          );
          await setDoc(followDoc, { status: STATUS.accepted });
        });
      });

      it("should not allow reading intention", async () => {
        const db = authContext.firestore();

        const intentionDoc = doc(db, intentionDocPath(intentionId));
        await assertFails(getDoc(intentionDoc));
      });
    });
  });
});
