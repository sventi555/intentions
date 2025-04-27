import {
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, setLogLevel } from 'firebase/firestore';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

setLogLevel('silent');

const USER_ID = 'USER_ID';

const testUser = {
  username: 'booga',
  private: true,
};

const userDocPath = (userId: string) => `users/${userId}`;
const usernameDocPath = (username: string) => `usernames/${username}`;

describe('user rules', () => {
  let testEnv: RulesTestEnvironment;

  let authContext: RulesTestContext;
  let unauthContext: RulesTestContext;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'intentions-test',
      firestore: {
        rules: fs.readFileSync(
          path.join(__dirname, '../firestore.rules'),
          'utf8',
        ),
        host: '127.0.0.1',
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

  describe('read', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();

        const userDoc = doc(db, userDocPath(USER_ID));
        await setDoc(userDoc, testUser);

        const usernameDoc = doc(db, usernameDocPath(testUser.username));
        await setDoc(usernameDoc, { userId: USER_ID });
      });
    });

    it('should allow reading users and usernames', async () => {
      const db = unauthContext.firestore();

      const userDoc = doc(db, userDocPath(USER_ID));
      await assertSucceeds(getDoc(userDoc));

      const usernameDoc = doc(db, usernameDocPath(testUser.username));
      await assertSucceeds(getDoc(usernameDoc));
    });
  });
});
