import mongoose, { Schema, Model } from 'mongoose';
import { IOTP, OTPPurpose } from '../types';
import { config } from '../config';

// OTP Schema
const otpSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    code: {
      type: String,
      required: true,
      length: 6,
    },
    purpose: {
      type: String,
      enum: ['registration', 'login', 'password_reset'] as OTPPurpose[],
      required: true,
      default: 'login',
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + config.otp.expiresIn * 60 * 1000),
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
      max: config.otp.maxAttempts || 5,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).__v;
        delete (ret as any).code;
        return ret;
      },
    },
  }
);

// Indexes
otpSchema.index({ email: 1 });
otpSchema.index({ email: 1, purpose: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
otpSchema.index({ createdAt: 1 });

// Static: Generate OTP code
otpSchema.statics.generateCode = function (): string {
  const length = config.otp.length || 6;
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
};

// Static: Create OTP for email
otpSchema.statics.createForEmail = async function (
  email: string,
  purpose: OTPPurpose = 'login'
): Promise<IOTP> {
  const normalizedEmail = email.toLowerCase();

  // Invalidate any existing OTPs for this email and purpose
  await this.updateMany(
    { email: normalizedEmail, purpose, isUsed: false },
    { $set: { isUsed: true } }
  );

  // Generate new OTP
  const code = (this as unknown as IOTPModel).generateCode();
  const expiresAt = new Date(Date.now() + config.otp.expiresIn * 60 * 1000);

  const otp = new this({
    email: normalizedEmail,
    code,
    purpose,
    expiresAt,
  });

  return otp.save();
};

// Static: Verify OTP
otpSchema.statics.verifyOTP = async function (
  email: string,
  code: string,
  purpose: OTPPurpose = 'login'
): Promise<{ success: boolean; message: string; messageAr: string }> {
  const normalizedEmail = email.toLowerCase();
  const maxAttempts = config.otp.maxAttempts || 5;

  const otp = await this.findOne({
    email: normalizedEmail,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otp) {
    return {
      success: false,
      message: 'OTP not found or expired',
      messageAr: 'رمز التحقق غير موجود أو منتهي الصلاحية',
    };
  }

  // Check max attempts
  if (otp.attempts >= maxAttempts) {
    otp.isUsed = true;
    await otp.save();
    return {
      success: false,
      message: 'Maximum attempts exceeded',
      messageAr: 'تم تجاوز الحد الأقصى للمحاولات',
    };
  }

  // Increment attempts
  otp.attempts += 1;

  // Verify code
  if (otp.code !== code) {
    await otp.save();
    const remaining = maxAttempts - otp.attempts;
    return {
      success: false,
      message: `Invalid OTP. ${remaining} attempts remaining`,
      messageAr: `رمز التحقق غير صحيح. ${remaining} محاولات متبقية`,
    };
  }

  // Mark as used
  otp.isUsed = true;
  await otp.save();

  return {
    success: true,
    message: 'OTP verified successfully',
    messageAr: 'تم التحقق من الرمز بنجاح',
  };
};

// Static: Check if can send new OTP (rate limiting)
otpSchema.statics.canSendNew = async function (
  email: string,
  purpose: OTPPurpose = 'login'
): Promise<{ canSend: boolean; waitSeconds?: number }> {
  const normalizedEmail = email.toLowerCase();
  const lastOtp = await this.findOne({ email: normalizedEmail, purpose }).sort({ createdAt: -1 });

  if (!lastOtp) {
    return { canSend: true };
  }

  const timeSinceLastOtp =
    (Date.now() - lastOtp.createdAt.getTime()) / 1000;
  const minWaitTime = 60; // 60 seconds between OTPs

  if (timeSinceLastOtp < minWaitTime) {
    return {
      canSend: false,
      waitSeconds: Math.ceil(minWaitTime - timeSinceLastOtp),
    };
  }

  return { canSend: true };
};

// Interface for OTP model with statics
interface IOTPModel extends Model<IOTP> {
  generateCode(): string;
  createForEmail(email: string, purpose?: OTPPurpose): Promise<IOTP>;
  verifyOTP(
    email: string,
    code: string,
    purpose?: OTPPurpose
  ): Promise<{ success: boolean; message: string; messageAr: string }>;
  canSendNew(email: string, purpose?: OTPPurpose): Promise<{ canSend: boolean; waitSeconds?: number }>;
}

// Create and export the model
const OTP = mongoose.model<IOTP, IOTPModel>('OTP', otpSchema);

export default OTP;
