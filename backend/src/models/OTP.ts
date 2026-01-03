import mongoose, { Schema, Model } from 'mongoose';
import { IOTP } from '../types';
import { config } from '../config';

// OTP Schema
const otpSchema = new Schema<IOTP>(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+20[0-9]{10}$/, 'Please enter a valid Egyptian phone number'],
    },
    code: {
      type: String,
      required: true,
      length: 6,
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
      max: 5,
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
otpSchema.index({ phone: 1 });
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

// Static: Create OTP for phone
otpSchema.statics.createForPhone = async function (
  phone: string
): Promise<IOTP> {
  // Invalidate any existing OTPs for this phone
  await this.updateMany(
    { phone, isUsed: false },
    { $set: { isUsed: true } }
  );

  // Generate new OTP
  const code = (this as unknown as IOTPModel).generateCode();
  const expiresAt = new Date(Date.now() + config.otp.expiresIn * 60 * 1000);

  const otp = new this({
    phone,
    code,
    expiresAt,
  });

  return otp.save();
};

// Static: Verify OTP
otpSchema.statics.verifyOTP = async function (
  phone: string,
  code: string
): Promise<{ success: boolean; message: string; messageAr: string }> {
  const otp = await this.findOne({
    phone,
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
  if (otp.attempts >= 5) {
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
    return {
      success: false,
      message: `Invalid OTP. ${5 - otp.attempts} attempts remaining`,
      messageAr: `رمز التحقق غير صحيح. ${5 - otp.attempts} محاولات متبقية`,
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
  phone: string
): Promise<{ canSend: boolean; waitSeconds?: number }> {
  const lastOtp = await this.findOne({ phone }).sort({ createdAt: -1 });

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
  createForPhone(phone: string): Promise<IOTP>;
  verifyOTP(
    phone: string,
    code: string
  ): Promise<{ success: boolean; message: string; messageAr: string }>;
  canSendNew(phone: string): Promise<{ canSend: boolean; waitSeconds?: number }>;
}

// Create and export the model
const OTP = mongoose.model<IOTP, IOTPModel>('OTP', otpSchema);

export default OTP;
