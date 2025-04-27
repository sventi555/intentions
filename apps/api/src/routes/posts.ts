import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createPostBody, updatePostBody } from 'lib';
import mime from 'mime-types';
import { db, storage } from '../config';
import { authenticate } from '../middleware/auth';

const app = new Hono();

app.post('/', authenticate, zValidator('json', createPostBody), async (c) => {
  const requesterId = c.var.uid;
  const data = c.req.valid('json');

  // need to get the intention and the user object to embed within the post data
  const intention = await db.doc(`intentions/${data.intentionId}`).get();
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

  const user = await db.doc(`users/${requesterId}`).get();
  const userData = user.data();
  if (!userData) {
    throw new HTTPException(500, { message: 'User information is missing.' });
  }

  let imageFileName: string | undefined = undefined;
  if (data.image) {
    const [imageMeta, image] = data.image.split(',');

    const contentType = imageMeta.match(/data:(.*);base64/)?.[1];
    if (!contentType) {
      throw new HTTPException(400, { message: 'Mime type missing.' });
    }

    const [mimeType] = contentType.split('/');
    if (!(mimeType === 'image' || mimeType === 'video')) {
      throw new HTTPException(400, {
        message: 'Mime type must be image or video.',
      });
    }

    const extension = mime.extension(contentType);
    if (!extension) {
      throw new HTTPException(400, { message: 'Invalid mime type provided.' });
    }

    const bucket = storage.bucket();

    const imageId = crypto.randomUUID();
    imageFileName = `posts/${requesterId}/${imageId}.${extension}`;
    await bucket.file(imageFileName).save(Buffer.from(image, 'base64'));
  }

  const postData = {
    userId: requesterId,
    user: { username: userData.username },
    intentionId: data.intentionId,
    intention: { name: intentionData.name },
    createdAt: Date.now(),
    ...(data.description ? { description: data.description } : {}),
    ...(imageFileName ? { image: imageFileName } : {}),
  };

  const writeBatch = db.bulkWriter();

  // add post to posts collection
  const postId = crypto.randomUUID();
  const postDoc = db.doc(`posts/${postId}`);
  writeBatch.create(postDoc, postData);

  // add post to follower feeds
  const followers = await db.collection(`follows/${requesterId}/from`).get();
  followers.docs.forEach((follower) => {
    const feedPost = db.doc(`users/${follower.id}/feed/${postId}`);
    writeBatch.create(feedPost, postData);
  });

  // add post to own feed
  const ownFeedPost = db.doc(`users/${requesterId}/feed/${postId}`);
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

    const postDoc = db.doc(`posts/${postId}`);
    const postData = (await postDoc.get()).data();
    if (!postData) {
      throw new HTTPException(404, { message: 'Post does not exist.' });
    }
    if (postData.userId !== requesterId) {
      throw new HTTPException(403, {
        message: 'Post is owned by another user.',
      });
    }

    const writeBatch = db.bulkWriter();

    writeBatch.update(postDoc, updatedData);

    const followers = await db.collection(`follows/${requesterId}/from`).get();
    followers.docs.forEach((follower) => {
      const feedPost = db.doc(`users/${follower.id}/feed/${postId}`);
      writeBatch.update(feedPost, updatedData);
    });

    const ownFeedPost = db.doc(`users/${requesterId}/feed/${postId}`);
    writeBatch.update(ownFeedPost, updatedData);

    await writeBatch.close();

    return c.body(null, 200);
  },
);

app.delete('/:id', authenticate, async (c) => {
  const requesterId = c.var.uid;
  const postId = c.req.param('id');

  const postDoc = db.doc(`posts/${postId}`);
  const postData = (await postDoc.get()).data();
  if (!postData) {
    return;
  }
  if (postData.userId !== requesterId) {
    throw new HTTPException(403, { message: 'Post is owned by another user.' });
  }

  const writeBatch = db.bulkWriter();

  writeBatch.delete(postDoc);

  const followers = await db.collection(`follows/${requesterId}/from`).get();
  followers.docs.forEach((follower) => {
    const feedPost = db.doc(`users/${follower.id}/feed/${postId}`);
    writeBatch.delete(feedPost);
  });

  const ownFeedPost = db.doc(`users/${requesterId}/feed/${postId}`);
  writeBatch.delete(ownFeedPost);

  await writeBatch.close();

  return c.body(null, 204);
});

export default app;
