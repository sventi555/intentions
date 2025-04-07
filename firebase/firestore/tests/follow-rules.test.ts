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
} from "firebase/firestore";
import fs from "node:fs";
import path from "node:path";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "vitest";

setLogLevel("silent");

const USER_IDS = {
  authUser: "authUser",
  privateUser: "privateUser",
  otherPrivateUser: "otherPrivateUser",
  publicUser: "publicUser",
  otherPublicUser: "otherPublicUser",
};

const testUsers = {
  [USER_IDS.authUser]: { username: "booga", private: true },
  [USER_IDS.privateUser]: { username: "private-user", private: true },
  [USER_IDS.otherPrivateUser]: {
    username: "other-private-user",
    private: true,
  },
  [USER_IDS.publicUser]: { username: "public-user", private: false },
  [USER_IDS.otherPublicUser]: {
    username: "other-public-user",
    private: false,
  },
};

const STATUS = { accepted: "accepted", pending: "pending" };

const followDocPath = (fromId: string, toId: string) =>
  `follows/${toId}/from/${fromId}`;

const addFollowWithoutRules = async (
  testEnv: RulesTestEnvironment,
  { from, to, status }: { from: string; to: string; status: string },
) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    const followDoc = doc(db, followDocPath(from, to));
    await setDoc(followDoc, { status });
  });
};

describe("follow rules", () => {
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
    await testEnv.clearFirestore();

    authContext = testEnv.authenticatedContext(USER_IDS.authUser);
    unauthContext = testEnv.unauthenticatedContext();
  });

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      for (const userId in testUsers) {
        const userDoc = doc(db, "users", userId);
        await setDoc(userDoc, testUsers[userId]);
      }
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe("read", () => {
    // ALLOWED
    describe.each([
      {
        from: USER_IDS.authUser,
        to: USER_IDS.privateUser,
        status: STATUS.pending,
      },
      {
        from: USER_IDS.authUser,
        to: USER_IDS.privateUser,
        status: STATUS.accepted,
      },
      {
        from: USER_IDS.privateUser,
        to: USER_IDS.authUser,
        status: STATUS.pending,
      },
      {
        from: USER_IDS.privateUser,
        to: USER_IDS.authUser,
        status: STATUS.accepted,
      },
      {
        from: USER_IDS.authUser,
        to: USER_IDS.publicUser,
        status: STATUS.accepted,
      },
      {
        from: USER_IDS.publicUser,
        to: USER_IDS.authUser,
        status: STATUS.pending,
      },
      {
        from: USER_IDS.publicUser,
        to: USER_IDS.authUser,
        status: STATUS.accepted,
      },
    ])("includes requester: follow %o", ({ from, to, status }) => {
      beforeEach(async () => {
        await addFollowWithoutRules(testEnv, { from, to, status });
      });

      it("should allow reading", async () => {
        const db = authContext.firestore();

        const followDoc = doc(db, followDocPath(from, to));
        await assertSucceeds(getDoc(followDoc));
      });
    });

    describe.each([
      {
        from: USER_IDS.publicUser,
        to: USER_IDS.privateUser,
        status: STATUS.accepted,
      },
      {
        from: USER_IDS.privateUser,
        to: USER_IDS.publicUser,
        status: STATUS.accepted,
      },
      {
        from: USER_IDS.publicUser,
        to: USER_IDS.otherPublicUser,
        status: STATUS.accepted,
      },
    ])(
      "includes someone public and is accepted: follow %o",
      ({ from, to, status }) => {
        beforeEach(async ({}) => {
          await addFollowWithoutRules(testEnv, { from, to, status });
        });

        it("should allow reading", async () => {
          const db = authContext.firestore();

          const followDoc = doc(db, followDocPath(from, to));
          await assertSucceeds(getDoc(followDoc));
        });
      },
    );

    describe.each([
      {
        from: USER_IDS.privateUser,
        to: USER_IDS.otherPrivateUser,
        status: STATUS.accepted,
      },
      {
        from: USER_IDS.otherPrivateUser,
        to: USER_IDS.privateUser,
        status: STATUS.accepted,
      },
    ])(
      "includes someone I'm following and is accepted: follow %o",
      ({ from, to, status }) => {
        beforeEach(async ({}) => {
          await addFollowWithoutRules(testEnv, { from, to, status });
          await addFollowWithoutRules(testEnv, {
            from: USER_IDS.authUser,
            to: USER_IDS.privateUser,
            status: STATUS.accepted,
          });
        });

        it("should allow reading", async () => {
          const db = authContext.firestore();

          const followDoc = doc(db, followDocPath(from, to));
          await assertSucceeds(getDoc(followDoc));
        });
      },
    );

    // NOT ALLOWED
    describe.each([
      {
        from: USER_IDS.privateUser,
        to: USER_IDS.otherPrivateUser,
        status: STATUS.accepted,
      },
      {
        from: USER_IDS.otherPrivateUser,
        to: USER_IDS.privateUser,
        status: STATUS.accepted,
      },
    ])(
      "includes someone that follows me, but I don't follow them, and is accepted: follow %o",
      ({ from, to, status }) => {
        beforeEach(async ({}) => {
          await addFollowWithoutRules(testEnv, { from, to, status });
          await addFollowWithoutRules(testEnv, {
            from: USER_IDS.privateUser,
            to: USER_IDS.authUser,
            status: STATUS.accepted,
          });
        });

        it("should not allow reading", async () => {
          const db = authContext.firestore();

          const followDoc = doc(db, followDocPath(from, to));
          await assertFails(getDoc(followDoc));
        });
      },
    );

    describe.each([
      {
        from: USER_IDS.publicUser,
        to: USER_IDS.privateUser,
        status: STATUS.pending,
      },
      {
        from: USER_IDS.privateUser,
        to: USER_IDS.otherPrivateUser,
        status: STATUS.pending,
      },
    ])(
      "is pending and does not include requester: follow %o",
      ({ from, to, status }) => {
        beforeEach(async ({}) => {
          await addFollowWithoutRules(testEnv, { from, to, status });
        });

        it("should not allow reading", async () => {
          const db = authContext.firestore();

          const followDoc = doc(db, followDocPath(from, to));
          await assertFails(getDoc(followDoc));
        });
      },
    );

    describe("includes only private non-friends", () => {
      const { from, to, status } = {
        from: USER_IDS.privateUser,
        to: USER_IDS.otherPrivateUser,
        status: STATUS.accepted,
      };

      beforeEach(async () => {
        await addFollowWithoutRules(testEnv, { from, to, status });
      });

      it("should not allow reading", async () => {
        const db = authContext.firestore();

        const followDoc = doc(db, followDocPath(from, to));
        await assertFails(getDoc(followDoc));
      });
    });
  });

  describe("create", () => {
    // ALLOWED
    it("should allow creating accepted follow to public user", async () => {
      const db = authContext.firestore();

      const followDoc = doc(
        db,
        followDocPath(USER_IDS.authUser, USER_IDS.publicUser),
      );
      await assertSucceeds(setDoc(followDoc, { status: STATUS.accepted }));
    });

    it("should allow creating pending follow to private user", async () => {
      const db = authContext.firestore();

      const followDoc = doc(
        db,
        followDocPath(USER_IDS.authUser, USER_IDS.privateUser),
      );
      await assertSucceeds(setDoc(followDoc, { status: STATUS.pending }));
    });

    describe.each([
      {
        from: USER_IDS.publicUser,
        to: USER_IDS.authUser,
        status: STATUS.accepted,
      },
      {
        from: USER_IDS.privateUser,
        to: USER_IDS.authUser,
        status: STATUS.pending,
      },
    ])(
      "requesting to follow someone who has requested to follow me: %o",
      ({ from, to, status }) => {
        beforeEach(async () => {
          await addFollowWithoutRules(testEnv, { from, to, status });
        });

        it("should allow creating", async () => {
          const db = authContext.firestore();

          const followDoc = doc(db, followDocPath(to, from));
          await assertSucceeds(setDoc(followDoc, { status }));
        });
      },
    );

    // NOT ALLOWED
    it("should not allow creating if user is not signed in", async () => {
      const db = unauthContext.firestore();

      const followDoc = doc(
        db,
        followDocPath(USER_IDS.authUser, USER_IDS.publicUser),
      );
      await assertFails(setDoc(followDoc, { status: STATUS.accepted }));
    });

    it("should not allow creating if fromUserId is not requester", async () => {
      const db = authContext.firestore();

      const followDoc = doc(
        db,
        followDocPath(USER_IDS.publicUser, USER_IDS.otherPublicUser),
      );
      await assertFails(setDoc(followDoc, { status: STATUS.accepted }));
    });

    it("should not allow creating with pending for public user", async () => {
      const db = authContext.firestore();

      const followDoc = doc(
        db,
        followDocPath(USER_IDS.authUser, USER_IDS.publicUser),
      );
      await assertFails(setDoc(followDoc, { status: STATUS.pending }));
    });

    it("should not allow creating with accepted for private user", async () => {
      const db = authContext.firestore();

      const followDoc = doc(
        db,
        followDocPath(USER_IDS.authUser, USER_IDS.privateUser),
      );
      await assertFails(setDoc(followDoc, { status: STATUS.accepted }));
    });
  });

  describe("update", () => {
    // ALLOWED
    describe("private receiver with pending follow", () => {
      const { from, to, status } = {
        from: USER_IDS.privateUser,
        to: USER_IDS.authUser,
        status: STATUS.pending,
      };

      beforeEach(async () => {
        await addFollowWithoutRules(testEnv, { from, to, status });
      });

      it("should allow updating status to success", async () => {
        const db = authContext.firestore();

        const followDoc = doc(db, followDocPath(from, to));
        await assertSucceeds(updateDoc(followDoc, { status: STATUS.accepted }));
      });
    });

    // NOT ALLOWED
    describe.each([
      {
        from: USER_IDS.authUser,
        to: USER_IDS.privateUser,
        status: STATUS.pending,
      },
      {
        from: USER_IDS.privateUser,
        to: USER_IDS.otherPrivateUser,
        status: STATUS.pending,
      },
      {
        from: USER_IDS.publicUser,
        to: USER_IDS.privateUser,
        status: STATUS.pending,
      },
    ])("not the receiver: %o", ({ from, to, status }) => {
      beforeEach(async () => {
        await addFollowWithoutRules(testEnv, { from, to, status });
      });

      it("should not allow updating status to accepted", async () => {
        const db = authContext.firestore();

        const followDoc = doc(db, followDocPath(from, to));
        await assertFails(updateDoc(followDoc, { status: STATUS.accepted }));
      });
    });

    describe("status is accepted", () => {
      const { from, to, status } = {
        from: USER_IDS.privateUser,
        to: USER_IDS.authUser,
        status: STATUS.accepted,
      };

      beforeEach(async () => {
        await addFollowWithoutRules(testEnv, { from, to, status });
      });

      it("should not allow updating status to pending", async () => {
        const db = authContext.firestore();

        const followDoc = doc(db, followDocPath(from, to));
        await assertFails(updateDoc(followDoc, { status: STATUS.pending }));
      });
    });
  });

  describe("delete", () => {
    // ALLOWED
    describe.each([
      {
        from: USER_IDS.authUser,
        to: USER_IDS.privateUser,
        status: STATUS.pending,
      },
      {
        from: USER_IDS.authUser,
        to: USER_IDS.privateUser,
        status: STATUS.accepted,
      },
      {
        from: USER_IDS.privateUser,
        to: USER_IDS.authUser,
        status: STATUS.pending,
      },
      {
        from: USER_IDS.privateUser,
        to: USER_IDS.authUser,
        status: STATUS.accepted,
      },
    ])("by sender or receiver: %o", ({ from, to, status }) => {
      beforeEach(async () => {
        await addFollowWithoutRules(testEnv, { from, to, status });
      });

      it("should allow deleting", async () => {
        const db = authContext.firestore();

        const followDoc = doc(db, followDocPath(from, to));
        await assertSucceeds(deleteDoc(followDoc));
      });
    });

    // NOT ALLOWED
    describe("not authenticated", () => {
      const { from, to, status } = {
        from: USER_IDS.authUser,
        to: USER_IDS.publicUser,
        status: STATUS.pending,
      };

      beforeEach(async () => {
        await addFollowWithoutRules(testEnv, { from, to, status });
      });

      it("should not allow deleting", async () => {
        const db = unauthContext.firestore();

        const followDoc = doc(db, followDocPath(from, to));
        assertFails(deleteDoc(followDoc));
      });
    });

    describe("requester not involved", () => {
      const { from, to, status } = {
        from: USER_IDS.publicUser,
        to: USER_IDS.otherPublicUser,
        status: "accepted",
      };

      beforeEach(async () => {
        await addFollowWithoutRules(testEnv, { from, to, status });
      });

      it("should not allow deleting", () => {
        const db = authContext.firestore();

        const followDoc = doc(db, followDocPath(from, to));
        assertFails(deleteDoc(followDoc));
      });
    });
  });
});
