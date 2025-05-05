import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createUserBody, updateUserBody } from 'lib';
import { auth } from '../config';
import { bulkWriter, collections } from '../db';
import { authenticate } from '../middleware/auth';
import { uploadMedia } from '../storage';

const app = new Hono();

app.post('/', zValidator('json', createUserBody), async (c) => {
  const { username, email, isPrivate, password } = c.req.valid('json');

  const existingEmail =
    (await collections.users().where('email', '==', email).get()).size > 0;
  if (existingEmail) {
    throw new HTTPException(409, { message: 'Email already taken.' });
  }

  const existingUsername =
    (await collections.users().where('username', '==', username).get()).size >
    0;
  if (existingUsername) {
    throw new HTTPException(409, { message: 'Username already taken.' });
  }

  const user = await auth.createUser({ email, password });
  await collections
    .users()
    .doc(user.uid)
    .create({ email, username, private: isPrivate });

  return c.body(null, 201);
});

app.patch('/', authenticate, zValidator('json', updateUserBody), async (c) => {
  const { image } = c.req.valid('json');
  const requesterId = c.var.uid;

  let imageFileName: string | undefined = undefined;
  if (image) {
    imageFileName = await uploadMedia(`dps/${requesterId}`, image, {
      validTypes: ['image'],
    });
  }

  const writeBatch = bulkWriter();

  // const update user profile
  const userDoc = collections.users().doc(requesterId);
  writeBatch.update(userDoc, {
    ...(imageFileName ? { image: imageFileName } : {}),
  });

  const updatePostData = {
    ...(imageFileName ? { 'user.image': imageFileName } : {}),
  };

  // update profile posts
  const userPosts = await collections
    .posts()
    .where('userId', '==', requesterId)
    .get();
  userPosts.forEach(async (post) => {
    writeBatch.update(post.ref, updatePostData);
  });

  // update feed posts
  const followers = await collections.follows(requesterId).get();
  followers.docs.forEach(async (follower) => {
    const feedPosts = await collections
      .feed(follower.id)
      .where('userId', '==', requesterId)
      .get();
    feedPosts.forEach((post) => {
      writeBatch.update(post.ref, updatePostData);
    });
  });
  const ownFeed = await collections
    .feed(requesterId)
    .where('userId', '==', requesterId)
    .get();
  ownFeed.forEach((post) => writeBatch.update(post.ref, updatePostData));

  await writeBatch.close();

  return c.body(null, 200);
});

export default app;
