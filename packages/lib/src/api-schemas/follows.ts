import { z } from 'zod';
import type { Follow } from '../db-models';

export type FollowUserResponse = Pick<Follow, 'status'>;

export const respondToFollowBody = z.object({
  action: z.enum(['accept', 'decline']),
});
export type RespondToFollowBody = z.infer<typeof respondToFollowBody>;

export const removeFollowBody = z.object({
  direction: z.enum(['to', 'from']),
});
export type RemoveFollowBody = z.infer<typeof removeFollowBody>;
