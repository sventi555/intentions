import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const username = process.argv[2];

if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.warn('auth emulator host not set');
}

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.warn('firestore emulator host not set');
}

if (!username) {
  console.error('must provide username as first argument');
  process.exit(1);
}

initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });

const db = getFirestore();
const auth = getAuth();
db.collection('users')
  .where('username', '==', username)
  .get()
  .then((res) => {
    auth.createCustomToken(res.docs[0].id).then((token) => console.log(token));
  });
