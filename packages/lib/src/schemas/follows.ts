import { z } from 'zod';

export type FollowUserResponse = { status: 'accepted' | 'pending' };

export const respondToFollowBody = z.object({
  action: z.enum(['accept', 'decline']),
});
export type RespondToFollowBody = z.infer<typeof respondToFollowBody>;

export const removeFollowBody = z.object({
  direction: z.enum(['to', 'from']),
});
export type RemoveFollowBody = z.infer<typeof removeFollowBody>;
