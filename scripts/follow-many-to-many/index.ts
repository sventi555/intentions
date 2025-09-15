import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({
  credential: applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

console.log(process.env);

const db = getFirestore(app);

console.log((await db.collection('follows').get()).size);

const follows = await db.collection('follows').get();

const writeBatch = db.bulkWriter();

for (const toUser of follows.docs) {
  const fromUsers = await db.collection(`follows/${toUser.id}/from`).get();
  for (const fromUser of fromUsers.docs) {
    const followData = fromUser.data();

    const inverseFollowDoc = db.doc(`follows/${fromUser.id}/to/${toUser.id}`);
    writeBatch.create(inverseFollowDoc, followData);
  }
}

await writeBatch.flush();
