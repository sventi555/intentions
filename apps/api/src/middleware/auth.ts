import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { auth } from '../config';

export const authenticate = createMiddleware<{ Variables: { uid: string } }>(
  async (c, next) => {
    try {
      const token = await auth.verifyIdToken(
        c.req.header('Authorization') ?? '',
      );
      c.set('uid', token.uid);

      await next();
    } catch {
      throw new HTTPException(401);
    }
  },
);
