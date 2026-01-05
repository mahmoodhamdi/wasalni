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
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate OTP for email (used by email.service.ts)
 * Note: OTP is sent via email using the Resend service
 */
export const generateEmailOTP = (): { otp: string; expiresAt: Date } => {
  const otp = generateOTP(config.otp.length);
  const expiresAt = getOTPExpiry(config.otp.expiresIn);
  return { otp, expiresAt };
};
