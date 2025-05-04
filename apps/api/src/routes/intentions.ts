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

    const intentionData = { userId: requesterId, name, createdAt: Date.now() };
    await collections.intentions().add(intentionData);

    return c.body(null, 201);
  },
);

export default app;
