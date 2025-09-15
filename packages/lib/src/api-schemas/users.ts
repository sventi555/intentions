import { z } from 'zod';

export const createUserBody = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
});
export type CreateUserBody = z.infer<typeof createUserBody>;

export const updateUserBody = z.object({
  image: z.string().optional(),
});
export type UpdateUserBody = z.infer<typeof updateUserBody>;
