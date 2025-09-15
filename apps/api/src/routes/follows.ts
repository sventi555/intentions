import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  removeFollowBody,
  respondToFollowBody,
  type Follow,
  type FollowUserResponse,
  type Notification,
} from 'lib';
import { bulkWriter, collections } from '../db';
import { authenticate } from '../middleware/auth';

const app = new Hono();

app.post('/:userId', authenticate, async (c) => {
  const requesterId = c.var.uid;
  const followedUserId = c.req.param('userId');

  // prevent from following self
  if (followedUserId === requesterId) {
    throw new HTTPException(400, { message: 'cannot follow yourself' });
  }

  // check for pre-existing follow
  const followDoc = collections.follows(followedUserId).doc(requesterId);
  const followDocResource = await followDoc.get();
  if (followDocResource.exists) {
    return;
  }

  // get recipient privacy
  const recipient = await collections.users().doc(followedUserId).get();
  const recipientData = recipient.data();
  if (!recipientData) {
    throw new HTTPException(404, { message: 'user does not exist' });
  }

  // get requester info for embedding in follow
  const requester = (await collections.users().doc(requesterId).get()).data();
  if (!requester) {
    throw new HTTPException(500);
  }
  const { username, image } = requester;

  const writeBatch = bulkWriter();

  // create follow
  const followData: Follow = {
    status: 'pending',
  };
  writeBatch.create(followDoc, followData);

  // send notification so recipient can respond to follow request
  const followNotification: Notification = {
    kind: 'follow',
    data: {
      fromUserId: requesterId,
      fromUser: {
        username,
        ...(image ? { image } : {}),
      },
      toUserId: followedUserId,
      toUser: {
        username: recipientData.username,
        ...(recipientData.image ? { image: recipientData.image } : {}),
      },
      status: 'pending',
    },
    createdAt: Date.now(),
  };
  writeBatch.create(
    collections.notifications(followedUserId).doc(crypto.randomUUID()),
    followNotification,
  );

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
        message: 'no follow request from user',
      });
    }

    // bail out early if request has already been accepted
    if (followData.status === 'accepted') {
      if (action === 'decline') {
        throw new HTTPException(412, {
          message:
            "cannot decline a request that's already accepted - delete it instead",
        });
      }

      return c.body(null, 200);
    }

    const writeBatch = bulkWriter();

    const requesterNotifications = await collections
      .notifications(requesterId)
      .where('kind', '==', 'follow')
      .where('data.fromUserId', '==', fromUserId)
      .orderBy('createdAt', 'desc')
      .get();
    const requesterNotification = requesterNotifications.empty
      ? null
      : requesterNotifications.docs[0];

    if (action === 'accept') {
      writeBatch.update(followDoc, { status: 'accepted' });
      if (requesterNotification) {
        writeBatch.update(requesterNotification.ref, {
          'data.status': 'accepted',
        });

        const notification = requesterNotification.data();

        writeBatch.create(
          collections.notifications(fromUserId).doc(crypto.randomUUID()),
          {
            ...notification,
            data: { ...notification.data, status: 'accepted' },
            createdAt: Date.now(),
          },
        );
      } else {
        // notification data missing. Could not create "acceptance" notification
      }

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
      if (requesterNotification) {
        writeBatch.delete(requesterNotification.ref);
      }
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
