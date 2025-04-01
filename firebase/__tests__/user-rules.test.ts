import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestContext,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  setLogLevel,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

setLogLevel("silent");

const USER_ID = "USER_ID";

const testUser = {
  username: "booga",
  private: true,
};

const userDocPath = (userId: string) => `users/${userId}`;
const usernameDocPath = (username: string) =>
  `index/users/username/${username}`;

describe("user rules", () => {
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

    authContext = testEnv.authenticatedContext(USER_ID);
    unauthContext = testEnv.unauthenticatedContext();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe("read", () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();

        const userDoc = doc(db, userDocPath(USER_ID));
        await setDoc(userDoc, testUser);

        const usernameDoc = doc(db, usernameDocPath(testUser.username));
        await setDoc(usernameDoc, { userId: USER_ID });
      });
    });

    it("should allow reading users and usernames", async () => {
      const db = unauthContext.firestore();

      const userDoc = doc(db, userDocPath(USER_ID));
      assertSucceeds(getDoc(userDoc));

      const usernameDoc = doc(db, usernameDocPath(testUser.username));
      assertSucceeds(getDoc(usernameDoc));
    });
  });

  describe("create", () => {
    // ALLOWED
    it("should create user with username", async () => {
      const db = authContext.firestore();
      const batch = writeBatch(db);

      const userDoc = doc(db, userDocPath(USER_ID));
      batch.set(userDoc, {
        ...testUser,
        imageUrl: "https://example.com",
      });

      const usernameDoc = doc(db, usernameDocPath(testUser.username));
      batch.set(usernameDoc, { userId: USER_ID });

      await assertSucceeds(batch.commit());
    });

    // NOT ALLOWED
    it("should not allow creating username or user separately", async () => {
      const db = authContext.firestore();

      const userDoc = doc(db, userDocPath(USER_ID));
      await assertFails(setDoc(userDoc, testUser));

      const usernameDoc = doc(db, usernameDocPath(testUser.username));
      await assertFails(setDoc(usernameDoc, { userId: USER_ID }));
    });

    it("should not allow creating user without authentication", async () => {
      const db = unauthContext.firestore();
      const batch = writeBatch(db);

      const userDoc = doc(db, userDocPath(USER_ID));
      batch.set(userDoc, testUser);

      const usernameDoc = doc(db, usernameDocPath(testUser.username));
      batch.set(usernameDoc, { userId: USER_ID });

      await assertFails(batch.commit());
    });

    it("should not allow creating user with different id from requester", async () => {
      const db = authContext.firestore();

      const otherUserId = "DIFFERENT_USER";

      const suspiciousIdPairs = [
        [USER_ID, otherUserId],
        [otherUserId, USER_ID],
        [otherUserId, otherUserId],
      ];

      for (const idPair of suspiciousIdPairs) {
        const batch = writeBatch(db);
        const userDoc = doc(db, userDocPath(idPair[0]));
        batch.set(userDoc, testUser);

        const usernameDoc = doc(db, usernameDocPath(testUser.username));
        batch.set(usernameDoc, { userId: idPair[1] });

        await assertFails(batch.commit());
      }
    });
  });

  describe("update", () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();

        const userDoc = doc(db, userDocPath(USER_ID));
        await setDoc(userDoc, testUser);

        const usernameDoc = doc(db, usernameDocPath(testUser.username));
        await setDoc(usernameDoc, { userId: USER_ID });
      });
    });

    // ALLOWED
    it("should allow updating all fields other than username", async () => {
      const db = authContext.firestore();

      const userDoc = doc(db, userDocPath(USER_ID));
      await assertSucceeds(
        updateDoc(userDoc, {
          private: !testUser.private,
          imageUrl: "https://new-url.com",
        }),
      );
    });

    // NOT ALLOWED
    it("should not allow updating user's username", async () => {
      const db = authContext.firestore();

      const userDoc = doc(db, userDocPath(USER_ID));
      await assertFails(updateDoc(userDoc, { username: "new-username" }));
    });

    it("should not allow updating username index", async () => {
      const db = authContext.firestore();

      const usernameDoc = doc(db, usernameDocPath(testUser.username));
      await assertFails(updateDoc(usernameDoc, { userId: "blah" }));
    });
  });

  describe("delete", () => {
    it("should not allow deleting (for now)", async () => {
      const db = authContext.firestore();

      const userDoc = doc(db, userDocPath(USER_ID));
      await assertFails(deleteDoc(userDoc));

      const usernameDoc = doc(db, usernameDocPath(testUser.username));
      await assertFails(deleteDoc(usernameDoc));

      const batch = writeBatch(db);
      batch.delete(userDoc);
      batch.delete(usernameDoc);
      await assertFails(batch.commit());
    });
  });
});
