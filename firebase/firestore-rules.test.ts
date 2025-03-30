import {
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestContext,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, writeBatch } from "firebase/firestore";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

describe("firestore rules", () => {
  let testEnv: RulesTestEnvironment;

  let authUserId: string;
  let authContext: RulesTestContext;
  let unauthContext: RulesTestContext;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "intentions-test",
      firestore: {
        rules: fs.readFileSync(path.join(__dirname, "firestore.rules"), "utf8"),
        host: "127.0.0.1",
        port: 8080,
      },
    });

    authUserId = "USER_ID";
    authContext = testEnv.authenticatedContext(authUserId);

    unauthContext = testEnv.unauthenticatedContext();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe("users", () => {
    it("should create user with username", async () => {
      const db = authContext.firestore();
      const batch = writeBatch(db);

      const username = "booga";

      const userDoc = doc(db, "users", authUserId);
      batch.set(userDoc, {
        username,
        private: true,
        imageUrl: "https://example.com",
      });

      const usernameDoc = doc(db, "index/users/username", username);
      batch.set(usernameDoc, { userId: authUserId });

      await assertSucceeds(batch.commit());
    });
  });
});
