import { zValidator } from '@hono/zod-validator';
import type { FirebaseAuthError, UserRecord } from 'firebase-admin/auth';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createUserBody, updateUserBody } from 'lib';
import { auth } from '../config';
import { bulkWriter, collections } from '../db';
import { userPostDocCopies } from '../db/denorm';
import { authenticate } from '../middleware/auth';
import { uploadMedia } from '../storage';

const app = new Hono();

app.post('/', zValidator('json', createUserBody), async (c) => {
  const { username, email, isPrivate, password } = c.req.valid('json');

  const existingUsername =
    (await collections.users().where('username', '==', username).get()).size >
    0;
  if (existingUsername) {
    throw new HTTPException(409, { message: 'username already taken' });
  }

  let user: UserRecord;
  try {
    user = await auth.createUser({ email, password });
  } catch (err) {
    const authError = err as FirebaseAuthError;
    switch (authError.code) {
      case 'auth/email-already-exists':
        throw new HTTPException(409, { message: 'email already taken' });
      case 'auth/invalid-email':
        throw new HTTPException(400, { message: 'invalid email' });
      case 'auth/invalid-password':
        throw new HTTPException(400, { message: 'invalid password' });
      default:
        throw new HTTPException(500);
    }
  }

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
      size: 128,
      validTypes: ['image'],
    });
  }

  const writeBatch = bulkWriter();

  // const update user profile
  const userDoc = collections.users().doc(requesterId);
  writeBatch.update(userDoc, {
    ...(imageFileName ? { image: imageFileName } : {}),
  });

  const updatedData = {
    ...(imageFileName ? { 'user.image': imageFileName } : {}),
  };

  const postDocs = await userPostDocCopies(requesterId);
  postDocs.forEach((doc) => writeBatch.update(doc, updatedData));

  // TODO: need to update notifications as well

  await writeBatch.close();

  return c.body(null, 200);
});

export default app;
