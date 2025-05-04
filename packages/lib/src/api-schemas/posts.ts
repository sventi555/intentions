import { z } from 'zod';

export const createPostBody = z
  .object({
    intentionId: z.string(),
    image: z.string().optional(),
    description: z.string().optional(),
  })
  .refine(({ image, description }) => image || description, {
    message: 'Image or description must be provided.',
  });
export type CreatePostBody = z.infer<typeof createPostBody>;

export const updatePostBody = z.object({
  description: z.string().optional(),
});
export type UpdatePostBody = z.infer<typeof updatePostBody>;
