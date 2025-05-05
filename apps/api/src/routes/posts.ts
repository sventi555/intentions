import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createPostBody, updatePostBody, type Post } from 'lib';
import { bulkWriter, collections } from '../db';
import { authenticate } from '../middleware/auth';
import { uploadMedia } from '../storage';

const app = new Hono();

app.post('/', authenticate, zValidator('json', createPostBody), async (c) => {
  const requesterId = c.var.uid;
  const data = c.req.valid('json');

  // need to get the intention and the user object to embed within the post data
  const intention = await collections.intentions().doc(data.intentionId).get();
  const intentionData = intention.data();
  if (!intentionData) {
    throw new HTTPException(404, {
      message: `An intention with id ${data.intentionId} does not exist.`,
    });
  }
  if (intentionData.userId !== requesterId) {
    throw new HTTPException(403, {
      message: 'Intention is owned by another user.',
    });
  }

  const user = await collections.users().doc(requesterId).get();
  const userData = user.data();
  if (!userData) {
    throw new HTTPException(500, { message: 'User information is missing.' });
  }

  let imageFileName: string | undefined = undefined;
  if (data.image) {
    imageFileName = await uploadMedia(`posts/${requesterId}`, data.image);
  }

  const postData: Post = {
    userId: requesterId,
    user: {
      username: userData.username,
      ...(userData.image ? { image: userData.image } : {}),
    },
    intentionId: data.intentionId,
    intention: { name: intentionData.name },
    createdAt: Date.now(),
    ...(data.description ? { description: data.description } : {}),
    ...(imageFileName ? { image: imageFileName } : {}),
  };

  const writeBatch = bulkWriter();

  // add post to posts collection
  const postId = crypto.randomUUID();
  const postDoc = collections.posts().doc(postId);
  writeBatch.create(postDoc, postData);

  // add post to follower feeds
  const followers = await collections.follows(requesterId).get();
  followers.docs.forEach((follower) => {
    const feedPost = collections.feed(follower.id).doc(postId);
    writeBatch.create(feedPost, postData);
  });

  // add post to own feed
  const ownFeedPost = collections.feed(requesterId).doc(postId);
  writeBatch.create(ownFeedPost, postData);

  await writeBatch.close();

  return c.body(null, 201);
});

app.patch(
  '/:id',
  authenticate,
  zValidator('json', updatePostBody),
  async (c) => {
    const requesterId = c.var.uid;
    const postId = c.req.param('id');
    const updatedData = c.req.valid('json');

    const postDoc = collections.posts().doc(postId);
    const postData = (await postDoc.get()).data();
    if (!postData) {
      throw new HTTPException(404, { message: 'Post does not exist.' });
    }
    if (postData.userId !== requesterId) {
      throw new HTTPException(403, {
        message: 'Post is owned by another user.',
      });
    }

    const writeBatch = bulkWriter();

    writeBatch.update(postDoc, updatedData);

    const followers = await collections.follows(requesterId).get();
    followers.docs.forEach((follower) => {
      const feedPost = collections.feed(follower.id).doc(postId);
      writeBatch.update(feedPost, updatedData);
    });

    const ownFeedPost = collections.feed(requesterId).doc(postId);
    writeBatch.update(ownFeedPost, updatedData);

    await writeBatch.close();

    return c.body(null, 200);
  },
);

app.delete('/:id', authenticate, async (c) => {
  const requesterId = c.var.uid;
  const postId = c.req.param('id');

  const postDoc = collections.posts().doc(postId);
  const postData = (await postDoc.get()).data();
  if (!postData) {
    return;
  }
  if (postData.userId !== requesterId) {
    throw new HTTPException(403, { message: 'Post is owned by another user.' });
  }

  const writeBatch = bulkWriter();

  writeBatch.delete(postDoc);

  const followers = await collections.follows(requesterId).get();
  followers.docs.forEach((follower) => {
    const feedPost = collections.feed(follower.id).doc(postId);
    writeBatch.delete(feedPost);
  });

  const ownFeedPost = collections.feed(requesterId).doc(postId);
  writeBatch.delete(ownFeedPost);

  await writeBatch.close();

  return c.body(null, 204);
});

export default app;
