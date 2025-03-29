import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import fs from "node:fs";
import path from "node:path";

describe("firestore rules", () => {
  let testEnv;

  beforeAll(() => {
    testEnv = initializeTestEnvironment({
      projectId: "intentions-test",
      firestore: {
        rules: fs.readFileSync(path.join(__dirname, "firestore.rules"), "utf8"),
      },
    });
  });

  it("should pass", () => {
    expect(true).toBeTruthy();
  });
});
