import { Follow, Intention, Post, User } from '@lib';
import { collection, doc, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from './config/firebase';

const firestoreConverter = <T>() => ({
  toFirestore: (data: T) => data,
  fromFirestore: (snap: QueryDocumentSnapshot<T>) => snap.data(),
});

const userConverter = firestoreConverter<User>();
const intentionConverter = firestoreConverter<Intention>();
const followConverter = firestoreConverter<Follow>();
const postConverter = firestoreConverter<Post>();

export const docs = {
  user: (id: string) => doc(db, `users/${id}`).withConverter(userConverter),
  intention: (id: string) =>
    doc(db, `intentions/${id}`).withConverter(intentionConverter),
  follow: (toId: string, fromId: string) =>
    doc(db, `follows/${toId}/from/${fromId}`).withConverter(followConverter),
  post: (id: string) => doc(db, `posts/${id}`).withConverter(postConverter),
};

export const collections = {
  users: () => collection(db, 'users').withConverter(userConverter),
  intentions: () =>
    collection(db, 'intentions').withConverter(intentionConverter),
  follows: (toId: string) =>
    collection(db, `follows/${toId}/from`).withConverter(followConverter),
  posts: () => collection(db, 'posts').withConverter(postConverter),
  feed: (userId: string) =>
    collection(db, `users/${userId}/feed`).withConverter(postConverter),
};
