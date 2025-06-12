import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createIntentionBody } from 'lib';
import { collections } from '../db';
import { authenticate } from '../middleware/auth';

const app = new Hono();

app.post(
  '/',
  authenticate,
  zValidator('json', createIntentionBody),
  async (c) => {
    const requesterId = c.var.uid;
    const { name } = c.req.valid('json');

    const existingIntention =
      (
        await collections
          .intentions()
          .where('userId', '==', requesterId)
          .where('name', '==', name)
          .get()
      ).size > 0;

    if (existingIntention) {
      throw new HTTPException(409, {
        message: 'User already has intention with same name.',
      });
    }

    const user = await collections.users().doc(requesterId).get();
    const userData = user.data();
    if (!userData) {
      throw new HTTPException(500, { message: 'User data is missing' });
    }

    const now = Date.now();
    await collections.intentions().add({
      userId: requesterId,
      user: {
        username: userData.username,
        ...(userData.image ? { image: userData.image } : {}),
      },
      name,
      createdAt: now,
      updatedAt: now,
      postCount: 0,
    });

    return c.body(null, 201);
  },
);

export default app;
