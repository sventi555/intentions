import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createPostBody, updatePostBody, type Post } from 'lib';
import { bulkWriter, collections } from '../db';
import { postDocCopies } from '../db/denorm';
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

  const postId = crypto.randomUUID();
  const postDocs = await postDocCopies(postId, requesterId);
  postDocs.forEach((doc) => writeBatch.create(doc, postData));

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

    const postData = (await collections.posts().doc(postId).get()).data();
    if (!postData) {
      throw new HTTPException(404, { message: 'Post does not exist.' });
    }
    if (postData.userId !== requesterId) {
      throw new HTTPException(403, {
        message: 'Post is owned by another user.',
      });
    }

    const writeBatch = bulkWriter();

    const postDocs = await postDocCopies(postId, requesterId);
    postDocs.forEach((doc) => writeBatch.update(doc, updatedData));

    await writeBatch.close();

    return c.body(null, 200);
  },
);

app.delete('/:id', authenticate, async (c) => {
  const requesterId = c.var.uid;
  const postId = c.req.param('id');

  const postData = (await collections.posts().doc(postId).get()).data();
  if (!postData) {
    return;
  }
  if (postData.userId !== requesterId) {
    throw new HTTPException(403, { message: 'Post is owned by another user.' });
  }

  const writeBatch = bulkWriter();

  const postDocs = await postDocCopies(postId, requesterId);
  postDocs.forEach((doc) => writeBatch.delete(doc));

  await writeBatch.close();

  return c.body(null, 204);
});

export default app;
