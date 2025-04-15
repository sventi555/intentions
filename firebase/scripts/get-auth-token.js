const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const userId = process.argv[2];

if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.warn("FIREBASE_AUTH_EMULATOR_HOST variable not set");
}

if (!userId) {
  console.error("must provide user id as first argument");
  process.exit(1);
}

initializeApp();

getAuth()
  .createCustomToken(userId)
  .then((token) => console.log(token));
