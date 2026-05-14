import { z } from 'zod';
import { phoneSchema, otpSchema } from './common.js';

export const requestOtpSchema = z.object({
  phone: phoneSchema,
});
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const passengerRegisterSchema = z.object({
  phone: phoneSchema,
  name: z.string().trim().min(2, 'الاسم قصير').max(50, 'الاسم طويل'),
  email: z.string().trim().email('البريد غير صحيح').optional().or(z.literal('')),
  gender: z.enum(['male', 'female']).optional(),
  referralCode: z.string().trim().max(16).optional(),
});
export type PassengerRegisterInput = z.infer<typeof passengerRegisterSchema>;

export const driverRegisterSchema = z.object({
  phone: phoneSchema,
  name: z.string().trim().min(2).max(50),
  email: z.string().trim().email().optional().or(z.literal('')),
  gender: z.enum(['male', 'female']),
  nationalId: z
    .string()
    .trim()
    .regex(/^\d{14}$/, 'الرقم القومي يجب أن يكون 14 رقم'),
  vehicleType: z.enum(['economy', 'comfort', 'family', 'tuktuk', 'motorcycle']),
  vehicle: z.object({
    make: z.string().trim().min(1).max(40),
    model: z.string().trim().min(1).max(40),
    year: z
      .number()
      .int()
      .min(1990)
      .max(new Date().getFullYear() + 1),
    color: z.string().trim().min(1).max(20),
    plateNumber: z.string().trim().min(1).max(20),
  }),
});
export type DriverRegisterInput = z.infer<typeof driverRegisterSchema>;
