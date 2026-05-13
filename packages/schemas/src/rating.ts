import { z } from 'zod';

export const ratingSchema = z.object({
  tripId: z.string(),
  score: z.number().int().min(1).max(5),
  comment: z.string().trim().max(280).optional(),
});
export type RatingInput = z.infer<typeof ratingSchema>;
