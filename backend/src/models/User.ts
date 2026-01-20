import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserRole, Gender, Language, EmergencyContact, AuthProvider } from '../types';

// Emergency Contact Schema
const emergencyContactSchema = new Schema<EmergencyContact>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: {
      type: String,
      enum: ['parent', 'spouse', 'sibling', 'friend', 'other'],
      default: 'other',
    },
    notifyOnTrip: { type: Boolean, default: true },
    notifyOnSOS: { type: Boolean, default: true },
  },
  { _id: true }
);

// User Schema
const userSchema = new Schema<IUser>(
  {
    role: {
      type: String,
      enum: ['passenger', 'driver', 'admin'] as UserRole[],
      required: true,
      default: 'passenger',
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[0-9]{10,15}$/, 'Please enter a valid phone number'],
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    authProvider: {
      type: String,
      enum: ['email', 'google'] as AuthProvider[],
      required: true,
      default: 'email',
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    avatar: {
      type: String,
    },
    gender: {
      type: String,
      enum: ['male', 'female'] as Gender[],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emergencyContact: {
      type: emergencyContactSchema,
    },
    fcmTokens: {
      type: [String],
      default: [],
    },
    language: {
      type: String,
      enum: ['ar', 'en'] as Language[],
      default: 'ar',
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete (ret as any).password;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes (email and googleId already indexed via unique: true)
userSchema.index({ phone: 1 }, { sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  const user = this as IUser & { password?: string };
  if (!user.password) return false;
  return bcrypt.compare(candidatePassword, user.password);
};

// Static method to find by email
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by Google ID
userSchema.statics.findByGoogleId = function (googleId: string) {
  return this.findOne({ googleId });
};

// Static method to find active users by role
userSchema.statics.findActiveByRole = function (role: UserRole) {
  return this.find({ role, isActive: true });
};

// Create and export the model
const User = mongoose.model('User', userSchema);

export default User;
