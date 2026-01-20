import User from '../models/User';
import Passenger from '../models/Passenger';
import Driver from '../models/Driver';
import OTP from '../models/OTP';
import { IUser, OTPPurpose } from '../types';
import { generateTokenPair, TokenPair, verifyToken } from '../utils/jwt';
import { generateOTP, getOTPExpiry } from '../utils/otp';
import { sendOTPEmail, sendWelcomeEmail } from './email.service';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { config } from '../config';
import admin from 'firebase-admin';
import { getFirebaseApp } from '../config/firebase';

export interface SendOTPResult {
  success: boolean;
  message: string;
  messageAr: string;
  expiresIn: number; // seconds
}

export interface VerifyOTPResult {
  success: boolean;
  isNewUser: boolean;
  user?: IUser;
  tokens?: TokenPair;
}

export interface RegisterPassengerData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  gender?: 'male' | 'female';
}

export interface RegisterDriverData {
  email: string;
  password: string;
  name: string;
  phone?: string;
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

export interface GoogleAuthData {
  idToken: string;
  role: 'passenger' | 'driver';
}

class AuthService {
  /**
   * Send OTP to email for registration/login/password reset
   */
  async sendOTP(
    email: string,
    purpose: OTPPurpose = 'login'
  ): Promise<SendOTPResult> {
    const normalizedEmail = email.toLowerCase();

    // Check rate limiting
    const canSend = await OTP.canSendNew(normalizedEmail, purpose);
    if (!canSend.canSend) {
      throw new BadRequestError(
        `Please wait ${canSend.waitSeconds} seconds before requesting another OTP`,
        `يرجى الانتظار ${canSend.waitSeconds} ثانية قبل طلب رمز جديد`
      );
    }

    // Check hourly limit
    const recentOTPs = await OTP.countDocuments({
      email: normalizedEmail,
      createdAt: { $gte: new Date(Date.now() - config.otp.rateLimitMinutes * 60 * 1000) },
    });

    if (recentOTPs >= 5) {
      throw new BadRequestError(
        `Too many OTP requests. Please try again later.`,
        `تم تجاوز الحد المسموح به. حاول مرة أخرى لاحقاً.`
      );
    }

    // For registration, check if user already exists
    if (purpose === 'registration') {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        throw new BadRequestError(
          'Email already registered. Please login instead.',
          'البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.'
        );
      }
    }

    // For login/password reset, check if user exists
    if (purpose === 'login' || purpose === 'password_reset') {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (!existingUser) {
        throw new NotFoundError(
          'No account found with this email.',
          'لا يوجد حساب بهذا البريد الإلكتروني.'
        );
      }
    }

    // Generate and save OTP
    const otp = await OTP.createForEmail(normalizedEmail, purpose);

    // Send OTP via email
    await sendOTPEmail(normalizedEmail, otp.code, purpose);

    return {
      success: true,
      message: 'Verification code sent to your email',
      messageAr: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
      expiresIn: config.otp.expiresIn * 60, // Convert to seconds
    };
  }

  /**
   * Verify OTP for login (existing user)
   */
  async verifyLoginOTP(email: string, code: string): Promise<{ user: IUser; tokens: TokenPair }> {
    const normalizedEmail = email.toLowerCase();

    // Verify OTP
    const result = await OTP.verifyOTP(normalizedEmail, code, 'login');
    if (!result.success) {
      throw new BadRequestError(result.message, result.messageAr);
    }

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw new NotFoundError(
        'User not found',
        'المستخدم غير موجود'
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedError(
        'Account is deactivated',
        'الحساب معطل'
      );
    }

    // Update user
    user.isEmailVerified = true;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    return { user: user as unknown as IUser, tokens };
  }

  /**
   * Verify OTP for registration (new user preparation)
   */
  async verifyRegistrationOTP(email: string, code: string): Promise<{ verified: boolean }> {
    const normalizedEmail = email.toLowerCase();

    // Verify OTP
    const result = await OTP.verifyOTP(normalizedEmail, code, 'registration');
    if (!result.success) {
      throw new BadRequestError(result.message, result.messageAr);
    }

    return { verified: true };
  }

  /**
   * Login with email and password
   */
  async loginWithPassword(email: string, password: string): Promise<{ user: IUser; tokens: TokenPair }> {
    const normalizedEmail = email.toLowerCase();

    // Find user with password
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      throw new UnauthorizedError(
        'Invalid email or password',
        'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      );
    }

    if (!user.password) {
      throw new UnauthorizedError(
        'Please use Google Sign-In or request an OTP',
        'يرجى استخدام تسجيل الدخول بجوجل أو طلب رمز التحقق'
      );
    }

    // Compare password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      throw new UnauthorizedError(
        'Invalid email or password',
        'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedError(
        'Account is deactivated',
        'الحساب معطل'
      );
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    return { user: user as unknown as IUser, tokens };
  }

  /**
   * Register new passenger with email
   */
  async registerPassenger(data: RegisterPassengerData): Promise<{ user: IUser; tokens: TokenPair }> {
    const normalizedEmail = data.email.toLowerCase();

    // Check if email already registered
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new BadRequestError(
        'Email already registered',
        'البريد الإلكتروني مسجل بالفعل'
      );
    }

    // Create user
    const user = await User.create({
      email: normalizedEmail,
      password: data.password,
      name: data.name,
      phone: data.phone,
      gender: data.gender,
      role: 'passenger',
      authProvider: 'email',
      isActive: true,
      isEmailVerified: true, // Already verified via OTP
    });

    // Create passenger profile
    await Passenger.create({
      userId: user._id,
    });

    // Send welcome email
    await sendWelcomeEmail(normalizedEmail, data.name, 'passenger');

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      role: 'passenger',
      email: user.email,
    });

    return { user: user as unknown as IUser, tokens };
  }

  /**
   * Register new driver with email
   */
  async registerDriver(data: RegisterDriverData & { googleId?: string; avatar?: string }): Promise<{ user: IUser; tokens: TokenPair }> {
    const normalizedEmail = data.email.toLowerCase();

    // Check if email already registered
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new BadRequestError(
        'Email already registered',
        'البريد الإلكتروني مسجل بالفعل'
      );
    }

    // Check if national ID already registered
    const existingNationalId = await Driver.findOne({ 'documents.nationalIdNumber': data.nationalId });
    if (existingNationalId) {
      throw new BadRequestError(
        'National ID already registered',
        'الرقم القومي مسجل بالفعل'
      );
    }

    // Create new user (inactive until approved)
    const isGoogleAuth = !!data.googleId;
    const user = await User.create({
      email: normalizedEmail,
      password: isGoogleAuth ? undefined : data.password,
      googleId: data.googleId,
      name: data.name,
      phone: data.phone,
      avatar: data.avatar,
      role: 'driver',
      authProvider: isGoogleAuth ? 'google' : 'email',
      isActive: false, // Will be activated after admin approval
      isEmailVerified: true,
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

    // Send welcome email
    await sendWelcomeEmail(normalizedEmail, data.name, 'driver');

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      role: 'driver',
      email: user.email,
    });

    return { user: user as unknown as IUser, tokens };
  }

  /**
   * Google Sign-In authentication
   */
  async googleSignIn(idToken: string, role: 'passenger' | 'driver' = 'passenger'): Promise<{ user: IUser; tokens: TokenPair; isNewUser: boolean; driver: any; needsDriverRegistration: boolean }> {
    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) {
      throw new BadRequestError(
        'Google Sign-In is not configured',
        'تسجيل الدخول بجوجل غير متاح حالياً'
      );
    }

    // Verify the Firebase ID token
    let decodedToken: admin.auth.DecodedIdToken;
    try {
      decodedToken = await admin.auth(firebaseApp).verifyIdToken(idToken);
    } catch (error) {
      throw new UnauthorizedError(
        'Invalid Google token',
        'رمز جوجل غير صالح'
      );
    }

    const { uid: googleId, email, name, picture } = decodedToken;

    if (!email) {
      throw new BadRequestError(
        'Email is required for Google Sign-In',
        'البريد الإلكتروني مطلوب لتسجيل الدخول بجوجل'
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user exists by Google ID
    let user = await User.findOne({ googleId });
    let isNewUser = false;

    if (!user) {
      // Check if user exists by email
      user = await User.findOne({ email: normalizedEmail });

      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        if (!user.avatar && picture) {
          user.avatar = picture;
        }
        await user.save();
      } else {
        // New user
        isNewUser = true;

        if (role === 'driver') {
          // For drivers: DON'T create User yet - just return Google info
          // User will be created when they complete the registration form
          return {
            user: {
              email: normalizedEmail,
              name: name || email.split('@')[0],
              avatar: picture,
              role: 'driver',
              googleId,
            } as unknown as IUser,
            tokens: {
              accessToken: '', // No token yet - not registered
              refreshToken: '',
            },
            isNewUser: true,
            driver: null,
            needsDriverRegistration: true,
          };
        }

        // For passengers: create user immediately
        user = await User.create({
          email: normalizedEmail,
          googleId,
          name: name || email.split('@')[0],
          avatar: picture,
          role,
          authProvider: 'google',
          isActive: true,
          isEmailVerified: true,
        });

        await Passenger.create({ userId: user._id });

        // Send welcome email
        await sendWelcomeEmail(normalizedEmail, user.name, role);
      }
    }

    if (!user.isActive && user.role !== 'driver') {
      throw new UnauthorizedError(
        'Account is deactivated',
        'الحساب معطل'
      );
    }

    // Check if driver needs to complete registration
    let driver = null;
    let needsDriverRegistration = false;
    if (user.role === 'driver') {
      driver = await Driver.findOne({ userId: user._id });
      if (!driver) {
        needsDriverRegistration = true;
      }
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    return { user: user as unknown as IUser, tokens, isNewUser, driver, needsDriverRegistration };
  }

  /**
   * Admin login with email/password
   */
  async adminLogin(email: string, password: string): Promise<{ user: IUser; tokens: TokenPair }> {
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail, role: 'admin' }).select('+password');
    if (!user) {
      throw new UnauthorizedError(
        'Invalid credentials',
        'بيانات الدخول غير صحيحة'
      );
    }

    if (!user.password) {
      throw new UnauthorizedError(
        'Invalid credentials',
        'بيانات الدخول غير صحيحة'
      );
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new UnauthorizedError(
        'Invalid credentials',
        'بيانات الدخول غير صحيحة'
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedError(
        'Account is deactivated',
        'الحساب غير مفعل'
      );
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      role: 'admin',
      email: user.email,
    });

    return { user: user as unknown as IUser, tokens };
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean }> {
    const normalizedEmail = email.toLowerCase();

    // Verify OTP
    const result = await OTP.verifyOTP(normalizedEmail, code, 'password_reset');
    if (!result.success) {
      throw new BadRequestError(result.message, result.messageAr);
    }

    // Find and update user
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      throw new NotFoundError(
        'User not found',
        'المستخدم غير موجود'
      );
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return { success: true };
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new NotFoundError(
        'User not found',
        'المستخدم غير موجود'
      );
    }

    if (!user.password) {
      throw new BadRequestError(
        'Cannot change password for Google-authenticated accounts',
        'لا يمكن تغيير كلمة المرور للحسابات المسجلة بجوجل'
      );
    }

    // Verify current password
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      throw new UnauthorizedError(
        'Current password is incorrect',
        'كلمة المرور الحالية غير صحيحة'
      );
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return { success: true };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const payload = verifyToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedError(
        'Invalid token',
        'توكن غير صالح'
      );
    }

    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError(
        'User not found or deactivated',
        'المستخدم غير موجود أو معطل'
      );
    }

    return generateTokenPair({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError(
        'User not found',
        'المستخدم غير موجود'
      );
    }
    return user as unknown as IUser;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: Partial<{ name: string; phone: string; avatar: string; gender: string }>
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError(
        'User not found',
        'المستخدم غير موجود'
      );
    }

    // Update allowed fields only
    if (data.name) user.name = data.name;
    if (data.phone) user.phone = data.phone;
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
      throw new NotFoundError(
        'User not found',
        'المستخدم غير موجود'
      );
    }

    // Add token if not already present
    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      await user.save();
    }
  }

  /**
   * Remove FCM token
   */
  async removeFCMToken(userId: string, fcmToken?: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) return;

    if (fcmToken) {
      user.fcmTokens = user.fcmTokens.filter(token => token !== fcmToken);
    } else {
      user.fcmTokens = [];
    }
    await user.save();
  }

  /**
   * Logout - remove FCM token
   */
  async logout(userId: string, fcmToken?: string): Promise<void> {
    await this.removeFCMToken(userId, fcmToken);
  }
}

export const authService = new AuthService();
