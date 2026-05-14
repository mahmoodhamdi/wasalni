import { z } from 'zod';
import { coordsSchema } from './location.js';

export const sosTriggerSchema = z.object({
  tripId: z.string().optional(),
  coords: coordsSchema,
  reason: z
    .enum(['feeling_unsafe', 'accident', 'medical', 'route_deviation', 'other'])
    .default('feeling_unsafe'),
  note: z.string().trim().max(280).optional(),
});
export type SosTriggerInput = z.infer<typeof sosTriggerSchema>;
