import User from '../models/User';
import Passenger from '../models/Passenger';
import Driver from '../models/Driver';
import OTP from '../models/OTP';
import { IUser } from '../types';
import { generateTokenPair, TokenPair } from '../utils/jwt';
import { generateOTP, getOTPExpiry, isOTPExpired, formatPhoneNumber, sendOTPSMS } from '../utils/otp';
import { comparePassword } from '../utils/password';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors';

export interface SendOTPResult {
  success: boolean;
  message: string;
  expiresIn: number; // seconds
}

export interface VerifyOTPResult {
  success: boolean;
  isNewUser: boolean;
  user?: IUser;
  tokens?: TokenPair;
}

export interface RegisterPassengerData {
  phone: string;
  name: string;
  email?: string;
  gender?: 'male' | 'female';
}

export interface RegisterDriverData {
  phone: string;
  name: string;
  email?: string;
  nationalId: string;
  vehicleType: 'car' | 'tuktuk' | 'motorcycle';
  vehicleCategory: 'economy' | 'comfort' | 'family';
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    plateNumber: string;
  };
}

class AuthService {
  /**
   * Send OTP to phone number
   */
  async sendOTP(phone: string): Promise<SendOTPResult> {
    const formattedPhone = formatPhoneNumber(phone);

    // Check rate limiting - max 5 OTPs per hour
    const recentOTPs = await OTP.countDocuments({
      phone: formattedPhone,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });

    if (recentOTPs >= 5) {
      throw new BadRequestError('تم تجاوز الحد المسموح به. حاول مرة أخرى بعد ساعة.');
    }

    // Generate OTP
    const otpCode = generateOTP(6);
    const expiresAt = getOTPExpiry(5); // 5 minutes

    // Delete any existing OTPs for this phone
    await OTP.deleteMany({ phone: formattedPhone });

    // Save new OTP
    await OTP.create({
      phone: formattedPhone,
      code: otpCode,
      expiresAt,
      attempts: 0,
    });

    // Send OTP via SMS
    await sendOTPSMS(formattedPhone, otpCode);

    return {
      success: true,
      message: 'تم إرسال رمز التحقق',
      expiresIn: 300, // 5 minutes in seconds
    };
  }

  /**
   * Verify OTP and authenticate user
   */
  async verifyOTP(phone: string, code: string): Promise<VerifyOTPResult> {
    const formattedPhone = formatPhoneNumber(phone);

    // Find OTP record
    const otpRecord = await OTP.findOne({ phone: formattedPhone, isUsed: false });

    if (!otpRecord) {
      throw new BadRequestError('رمز التحقق غير صالح أو منتهي الصلاحية');
    }

    // Check if expired
    if (isOTPExpired(otpRecord.expiresAt)) {
      await OTP.deleteOne({ _id: otpRecord._id });
      throw new BadRequestError('رمز التحقق منتهي الصلاحية');
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      throw new BadRequestError('تم تجاوز عدد المحاولات المسموح بها');
    }

    // Verify code
    if (otpRecord.code !== code) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      throw new BadRequestError('رمز التحقق غير صحيح');
    }

    // OTP is valid, mark as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Check if user exists
    const existingUser = await User.findOne({ phone: formattedPhone });

    if (existingUser) {
      // Update last login
      existingUser.lastLoginAt = new Date();
      existingUser.isPhoneVerified = true;
      await existingUser.save();

      // Generate tokens
      const tokens = generateTokenPair({
        userId: existingUser._id.toString(),
        role: existingUser.role,
        phone: existingUser.phone,
      });

      return {
        success: true,
        isNewUser: false,
        user: existingUser as unknown as IUser,
        tokens,
      };
    }

    // New user - return flag to proceed with registration
    return {
      success: true,
      isNewUser: true,
    };
  }

  /**
   * Register new passenger
   */
  async registerPassenger(data: RegisterPassengerData): Promise<{ user: IUser; tokens: TokenPair }> {
    const formattedPhone = formatPhoneNumber(data.phone);

    // Check if phone already registered
    const existing = await User.findOne({ phone: formattedPhone });
    if (existing) {
      throw new BadRequestError('رقم الهاتف مسجل بالفعل');
    }

    // Create user first
    const user = await User.create({
      phone: formattedPhone,
      name: data.name,
      email: data.email,
      gender: data.gender,
      role: 'passenger',
      isActive: true,
      isPhoneVerified: true,
    });

    // Create passenger profile
    await Passenger.create({
      userId: user._id,
    });

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      role: 'passenger',
      phone: user.phone,
    });

    return { user: user as unknown as IUser, tokens };
  }

  /**
   * Register new driver
   */
  async registerDriver(data: RegisterDriverData): Promise<{ user: IUser; tokens: TokenPair }> {
    const formattedPhone = formatPhoneNumber(data.phone);

    // Check if phone already registered
    const existing = await User.findOne({ phone: formattedPhone });
    if (existing) {
      throw new BadRequestError('رقم الهاتف مسجل بالفعل');
    }

    // Check if national ID already registered
    const existingNationalId = await Driver.findOne({ 'documents.nationalIdNumber': data.nationalId });
    if (existingNationalId) {
      throw new BadRequestError('الرقم القومي مسجل بالفعل');
    }

    // Create user first (inactive until approved)
    const user = await User.create({
      phone: formattedPhone,
      name: data.name,
      email: data.email,
      role: 'driver',
      isActive: false, // Will be activated after approval
      isPhoneVerified: true,
    });

    // Create driver profile (pending approval)
    await Driver.create({
      userId: user._id,
      documents: {
        nationalIdNumber: data.nationalId,
      },
      vehicle: {
        type: data.vehicleType,
        category: data.vehicleCategory,
        make: data.vehicle.make,
        model: data.vehicle.model,
        year: data.vehicle.year,
        color: data.vehicle.color,
        plateNumber: data.vehicle.plateNumber,
        seats: data.vehicleType === 'car' ? 4 : data.vehicleType === 'tuktuk' ? 3 : 1,
      },
      status: 'pending',
    });

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      role: 'driver',
      phone: user.phone,
    });

    return { user: user as unknown as IUser, tokens };
  }

  /**
   * Admin login with email/password
   */
  async adminLogin(email: string, password: string): Promise<{ user: IUser; tokens: TokenPair }> {
    const user = await User.findOne({ email, role: 'admin' }).select('+password');

    if (!user) {
      throw new UnauthorizedError('بيانات الدخول غير صحيحة');
    }

    if (!user.password) {
      throw new UnauthorizedError('بيانات الدخول غير صحيحة');
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('بيانات الدخول غير صحيحة');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('الحساب غير مفعل');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      role: 'admin',
      phone: user.phone,
    });

    return { user: user as unknown as IUser, tokens };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const { verifyToken } = await import('../utils/jwt');

    const payload = verifyToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedError('توكن غير صالح');
    }

    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('المستخدم غير موجود أو غير مفعل');
    }

    return generateTokenPair({
      userId: user._id.toString(),
      role: user.role,
      phone: user.phone,
    });
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('المستخدم غير موجود');
    }
    return user as unknown as IUser;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: Partial<{ name: string; email: string; avatar: string; gender: string }>
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('المستخدم غير موجود');
    }

    // Update allowed fields only
    if (data.name) user.name = data.name;
    if (data.email) user.email = data.email;
    if (data.avatar) user.avatar = data.avatar;
    if (data.gender && (data.gender === 'male' || data.gender === 'female')) {
      user.gender = data.gender;
    }

    await user.save();
    return user as unknown as IUser;
  }

  /**
   * Update FCM token for push notifications
   */
  async updateFCMToken(userId: string, fcmToken: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('المستخدم غير موجود');
    }

    // Add token if not already present
    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      await user.save();
    }
  }

  /**
   * Logout - remove FCM token
   */
  async logout(userId: string, fcmToken?: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) return;

    if (fcmToken) {
      // Remove specific token
      user.fcmTokens = user.fcmTokens.filter(token => token !== fcmToken);
    } else {
      // Clear all tokens
      user.fcmTokens = [];
    }
    await user.save();
  }
}

export const authService = new AuthService();
