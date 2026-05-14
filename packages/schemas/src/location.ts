import { z } from 'zod';

export const coordsSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type Coords = z.infer<typeof coordsSchema>;

export const locationSchema = coordsSchema.extend({
  address: z.string().trim().min(1).max(255),
  placeId: z.string().optional(),
});
export type LocationInput = z.infer<typeof locationSchema>;

export const savedPlaceSchema = z.object({
  name: z.string().trim().min(1).max(40),
  address: z.string().trim().min(1).max(255),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  type: z.enum(['home', 'work', 'favorite']),
});
export type SavedPlaceInput = z.infer<typeof savedPlaceSchema>;

export const placeSearchSchema = z.object({
  query: z.string().trim().min(1).max(120),
  near: coordsSchema.optional(),
  limit: z.number().int().min(1).max(20).default(8),
});
export type PlaceSearchInput = z.infer<typeof placeSearchSchema>;
