import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import type { Follow, Intention, Post, User } from 'lib';
import { db } from '../config';

const firestoreConverter = <T>() => ({
  toFirestore: (data: T) => data,
  fromFirestore: (snap: QueryDocumentSnapshot<T>) => snap.data(),
});

export const collections = {
  users: () => db.collection('users').withConverter(firestoreConverter<User>()),
  follows: (toUser: string) =>
    db
      .collection(`follows/${toUser}/from`)
      .withConverter(firestoreConverter<Follow>()),
  intentions: () =>
    db.collection('intentions').withConverter(firestoreConverter<Intention>()),
  posts: () => db.collection('posts').withConverter(firestoreConverter<Post>()),
  feed: (userId: string) =>
    db
      .collection(`users/${userId}/feed`)
      .withConverter(firestoreConverter<Post>()),
};

export const bulkWriter = () => db.bulkWriter();
