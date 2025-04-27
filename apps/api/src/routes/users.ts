import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createUserBody } from 'lib';
import { auth, db } from '../config';

const app = new Hono();

app.post('/', zValidator('json', createUserBody), async (c) => {
  const { username, email, isPrivate, password } = c.req.valid('json');

  const existingEmail =
    (await db.collection('users').where('email', '==', email).get()).size > 0;
  if (existingEmail) {
    throw new HTTPException(409, { message: 'Email already taken.' });
  }

  const existingUsername =
    (await db.collection('users').where('username', '==', username).get())
      .size > 0;
  if (existingUsername) {
    throw new HTTPException(409, { message: 'Username already taken.' });
  }

  const user = await auth.createUser({ email, password });
  await db
    .doc(`users/${user.uid}`)
    .create({ email, username, private: isPrivate });

  return c.body(null, 201);
});

export default app;
