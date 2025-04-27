import { z } from 'zod';

export const createIntentionBody = z.object({ name: z.string().min(1) });
export type CreateIntentionBody = z.infer<typeof createIntentionBody>;
