import crypto from 'crypto';
import { config } from '../config';

/**
 * Generate a random numeric OTP
 */
export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    otp += digits[randomIndex];
  }

  return otp;
};

/**
 * Generate OTP expiry time
 */
export const getOTPExpiry = (minutes: number = 5): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Check if OTP is expired
 */
export const isOTPExpired = (expiresAt: Date): boolean => {
  return new Date() > new Date(expiresAt);
};

/**
 * Hash OTP for storage (optional security measure)
 */
export const hashOTP = (otp: string): string => {
  return crypto
    .createHash('sha256')
    .update(otp + config.jwt.secret)
    .digest('hex');
};

/**
 * Verify OTP hash
 */
export const verifyOTPHash = (otp: string, hash: string): boolean => {
  const otpHash = hashOTP(otp);
  return otpHash === hash;
};

/**
 * Format phone number to international format (Egypt)
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Handle Egyptian numbers
  if (cleaned.startsWith('0')) {
    cleaned = '2' + cleaned; // Add Egypt country code
  }

  if (!cleaned.startsWith('2')) {
    cleaned = '2' + cleaned;
  }

  return '+' + cleaned;
};

/**
 * Validate Egyptian phone number
 */
export const validateEgyptianPhone = (phone: string): boolean => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Egyptian mobile numbers: 01[0125][0-9]{8}
  // With country code: 201[0125][0-9]{8}
  const patterns = [
    /^01[0125]\d{8}$/,      // Local format: 01xxxxxxxxx
    /^201[0125]\d{8}$/,     // International without +
    /^\+201[0125]\d{8}$/,   // International with +
  ];

  return patterns.some(pattern => pattern.test(phone) || pattern.test(cleaned));
};

/**
 * Mock SMS sending (replace with actual SMS provider in production)
 */
export const sendOTPSMS = async (phone: string, otp: string): Promise<boolean> => {
  // In production, integrate with SMS provider like:
  // - Twilio
  // - Vonage (Nexmo)
  // - MessageBird
  // - Local Egyptian providers (Vodafone, Orange, etc.)

  if (process.env.NODE_ENV === 'development' || process.env.SMS_PROVIDER === 'mock') {
    console.log(`\n========================================`);
    console.log(`📱 SMS OTP for ${phone}: ${otp}`);
    console.log(`========================================\n`);
    return true;
  }

  // TODO: Implement actual SMS sending
  // Example with Twilio:
  // const twilioClient = require('twilio')(accountSid, authToken);
  // await twilioClient.messages.create({
  //   body: `رمز التحقق الخاص بك في وصّلني: ${otp}`,
  //   from: '+1234567890',
  //   to: phone
  // });

  return true;
};
