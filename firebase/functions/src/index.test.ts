import { it, expect } from "vitest";

console.log(process.env.FIRESTORE_EMULATOR_HOST);

it("should run", () => {
  expect(true).toBeTruthy();
});
