import { z } from 'zod';
import { locationSchema } from './location';

export const vehicleTypeSchema = z.enum(['economy', 'comfort', 'family', 'tuktuk', 'motorcycle']);
export type VehicleType = z.infer<typeof vehicleTypeSchema>;

export const paymentMethodSchema = z.enum(['cash', 'wallet', 'card']);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const tripStatusSchema = z.enum([
  'pending',
  'searching',
  'accepted',
  'arriving',
  'arrived',
  'in_progress',
  'completed',
  'cancelled',
]);
export type TripStatus = z.infer<typeof tripStatusSchema>;

export const fareEstimateSchema = z.object({
  pickup: locationSchema,
  dropoff: locationSchema,
  stops: z.array(locationSchema).max(3).optional(),
  rideType: vehicleTypeSchema,
  scheduledAt: z.coerce.date().optional(),
  promoCode: z.string().trim().max(16).optional(),
});
export type FareEstimateInput = z.infer<typeof fareEstimateSchema>;

export const bookTripSchema = fareEstimateSchema.extend({
  paymentMethod: paymentMethodSchema,
  notes: z.string().trim().max(280).optional(),
});
export type BookTripInput = z.infer<typeof bookTripSchema>;

export const cancelTripSchema = z.object({
  tripId: z.string(),
  reason: z
    .enum([
      'passenger_cancelled',
      'driver_cancelled',
      'no_drivers',
      'timeout',
      'payment_failed',
      'other',
    ])
    .default('passenger_cancelled'),
  comment: z.string().trim().max(280).optional(),
});
export type CancelTripInput = z.infer<typeof cancelTripSchema>;
