import { collections } from '.';

/**
 * Provides all the denormalized copies of the specified post doc.
 */
export const postDocCopies = async (postId: string, ownerId: string) => {
  const originalPostDoc = collections.posts().doc(postId);

  const followers = await collections.follows(ownerId).get();
  const followerPostDocs = followers.docs.map((follower) =>
    collections.feed(follower.id).doc(postId),
  );

  const ownFeedPostDoc = collections.feed(ownerId).doc(postId);

  return [originalPostDoc, ...followerPostDocs, ownFeedPostDoc];
};

/**
 * Provides all denormalized copies of posts created by `userId`.
 */
export const userPostDocCopies = async (userId: string) => {
  const userPostDocs = (
    await collections.posts().where('userId', '==', userId).get()
  ).docs.map((doc) => doc.ref);

  const followers = await collections.follows(userId).get();
  const followerPostDocs = await Promise.all(
    followers.docs.map(
      async (follower) =>
        (
          await collections
            .feed(follower.id)
            .where('userId', '==', userId)
            .get()
        ).docs,
    ),
  ).then((docs) => docs.flat().map((doc) => doc.ref));

  const ownFeedPostDocs = (
    await collections.feed(userId).where('userId', '==', userId).get()
  ).docs.map((doc) => doc.ref);

  return [...userPostDocs, ...followerPostDocs, ...ownFeedPostDocs];
};
