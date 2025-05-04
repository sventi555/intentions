import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  removeFollowBody,
  respondToFollowBody,
  type Follow,
  type FollowUserResponse,
} from 'lib';
import { bulkWriter, collections } from '../db';
import { authenticate } from '../middleware/auth';

const app = new Hono();

app.post('/:userId', authenticate, async (c) => {
  const requesterId = c.var.uid;
  const followedUserId = c.req.param('userId');

  // prevent from following self
  if (followedUserId === requesterId) {
    throw new HTTPException(400, { message: 'Cannot follow yourself.' });
  }

  // check for pre-existing follow
  const followDoc = collections.follows(followedUserId).doc(requesterId);
  const followDocResource = await followDoc.get();
  if (followDocResource.exists) {
    return;
  }

  // get recipient privacy
  const recipient = await collections.users().doc(followedUserId).get();
  if (!recipient.exists) {
    throw new HTTPException(404, { message: 'User does not exist.' });
  }
  const isPrivate = recipient.data()?.private;

  // get requester info for embedding in follow
  const requester = (await collections.users().doc(requesterId).get()).data();
  if (!requester) {
    throw new HTTPException(500, { message: 'Requester data is missing' });
  }
  const { username } = requester;

  const writeBatch = bulkWriter();

  // create follow
  const followData: Follow = {
    status: isPrivate ? 'pending' : 'accepted',
    fromUser: { username },
    createdAt: Date.now(),
  } as const;
  writeBatch.create(followDoc, followData);

  // if status is immediately accepted (recipient is public), update feed
  if (!isPrivate) {
    const followedPosts = await collections
      .posts()
      .where('userId', '==', followedUserId)
      .get();

    followedPosts.forEach((post) => {
      const feedPostDoc = collections.feed(requesterId).doc(post.id);
      writeBatch.create(feedPostDoc, post.data());
    });
  }

  await writeBatch.close();

  return c.json<FollowUserResponse>({ status: followData.status }, 201);
});

app.post(
  '/respond/:userId',
  authenticate,
  zValidator('json', respondToFollowBody),
  async (c) => {
    const requesterId = c.var.uid;
    const fromUserId = c.req.param('userId');
    const { action } = c.req.valid('json');

    const followDoc = collections.follows(requesterId).doc(fromUserId);
    const followData = (await followDoc.get()).data();
    if (!followData) {
      throw new HTTPException(404, {
        message: 'No follow request from this user.',
      });
    }

    // bail out early if request has already been accepted
    if (followData.status === 'accepted') {
      if (action === 'decline') {
        throw new HTTPException(412, {
          message:
            "Cannot decline a request that's already accepted. Delete it instead.",
        });
      }

      return c.body(null, 200);
    }

    const writeBatch = bulkWriter();

    if (action === 'accept') {
      writeBatch.update(followDoc, { status: 'accepted' });

      const followedPosts = await collections
        .posts()
        .where('userId', '==', requesterId)
        .get();

      followedPosts.forEach((post) => {
        const feedPostDoc = collections.feed(fromUserId).doc(post.id);
        writeBatch.create(feedPostDoc, post.data());
      });
    } else {
      writeBatch.delete(followDoc);
    }

    await writeBatch.close();

    return c.body(null, 200);
  },
);

app.delete(
  '/:userId',
  authenticate,
  zValidator('json', removeFollowBody),
  async (c) => {
    const requesterId = c.var.uid;
    const userId = c.req.param('userId');
    const { direction } = c.req.valid('json');

    const fromUserId = direction === 'from' ? userId : requesterId;
    const toUserId = direction === 'from' ? requesterId : userId;

    const followDoc = collections.follows(toUserId).doc(fromUserId);

    const writeBatch = bulkWriter();

    writeBatch.delete(followDoc);

    const followedPosts = await collections
      .feed(fromUserId)
      .where('userId', '==', toUserId)
      .get();

    followedPosts.forEach((post) => {
      writeBatch.delete(post.ref);
    });

    await writeBatch.close();

    return c.body(null, 204);
  },
);

export default app;
