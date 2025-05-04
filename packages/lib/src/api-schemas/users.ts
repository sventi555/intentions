import { z } from 'zod';

export const createUserBody = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
  isPrivate: z.boolean(),
});
export type CreateUserBody = z.infer<typeof createUserBody>;
