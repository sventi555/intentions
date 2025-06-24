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
  const intentionDoc = collections.intentions().doc(data.intentionId);
  const intentionData = (await intentionDoc.get()).data();
  if (!intentionData || intentionData.userId !== requesterId) {
    throw new HTTPException(404, {
      message: 'intention does not exist',
    });
  }

  const user = await collections.users().doc(requesterId).get();
  const userData = user.data();
  if (!userData) {
    throw new HTTPException(500);
  }

  let imageFileName: string | undefined = undefined;
  if (data.image) {
    imageFileName = await uploadMedia(`posts/${requesterId}`, data.image, 640);
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

  writeBatch.update(intentionDoc, {
    updatedAt: Date.now(),
    postCount: intentionData.postCount + 1,
  });

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
    if (!postData || postData.userId !== requesterId) {
      throw new HTTPException(404, { message: 'post does not exist' });
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
  if (!postData || postData.userId !== requesterId) {
    return c.body(null, 204);
  }

  const writeBatch = bulkWriter();

  const postDocs = await postDocCopies(postId, requesterId);
  postDocs.forEach((doc) => writeBatch.delete(doc));

  const intentionDoc = collections.intentions().doc(postData.intentionId);
  const intentionData = (await intentionDoc.get()).data();
  if (intentionData) {
    writeBatch.update(intentionDoc, { postCount: intentionData.postCount - 1 });
  }

  await writeBatch.close();

  return c.body(null, 204);
});

export default app;
