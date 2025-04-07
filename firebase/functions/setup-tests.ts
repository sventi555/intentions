// We don't want to accidentally affect production when running tests
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("firestore emulator host not specified");
  process.exit(1);
}
