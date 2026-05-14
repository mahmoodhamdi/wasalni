import { z } from 'zod';
import { phoneSchema } from './common.js';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  email: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  gender: z.enum(['male', 'female']).optional(),
  avatar: z.string().url().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const emergencyContactSchema = z.object({
  name: z.string().trim().min(1).max(40),
  phone: phoneSchema,
  relationship: z.string().trim().min(1).max(30),
});
export type EmergencyContactInput = z.infer<typeof emergencyContactSchema>;

export const fcmTokenSchema = z.object({
  token: z.string().trim().min(20).max(512),
  platform: z.enum(['web', 'android', 'ios']).default('web'),
});
export type FcmTokenInput = z.infer<typeof fcmTokenSchema>;
