import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { BadRequestError } from '../utils/errors';
import { OTPPurpose } from '../types';

/**
 * Send OTP to email
 * POST /api/v1/auth/send-otp
 */
export const sendOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, purpose = 'login' } = req.body;

    if (!email) {
      throw new BadRequestError('Email is required', 'البريد الإلكتروني مطلوب');
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestError('Invalid email format', 'صيغة البريد الإلكتروني غير صحيحة');
    }

    // Validate purpose
    const validPurposes: OTPPurpose[] = ['registration', 'login', 'password_reset'];
    if (!validPurposes.includes(purpose)) {
      throw new BadRequestError('Invalid purpose', 'الغرض غير صحيح');
    }

    const result = await authService.sendOTP(email, purpose as OTPPurpose);
    sendSuccess(res, { expiresIn: result.expiresIn }, result.message, result.messageAr);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP for login
 * POST /api/v1/auth/verify-otp
 */
export const verifyLoginOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new BadRequestError(
        'Email and OTP are required',
        'البريد الإلكتروني ورمز التحقق مطلوبين'
      );
    }

    if (otp.length !== 6) {
      throw new BadRequestError(
        'OTP must be 6 digits',
        'رمز التحقق يجب أن يكون 6 أرقام'
      );
    }

    const result = await authService.verifyLoginOTP(email, otp);

    sendSuccess(res, {
      user: result.user,
      tokens: result.tokens,
    }, 'Login successful', 'تم تسجيل الدخول بنجاح');
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP for registration
 * POST /api/v1/auth/verify-registration-otp
 */
export const verifyRegistrationOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new BadRequestError(
        'Email and OTP are required',
        'البريد الإلكتروني ورمز التحقق مطلوبين'
      );
    }

    const result = await authService.verifyRegistrationOTP(email, otp);

    sendSuccess(res, { verified: result.verified }, 'OTP verified - please complete registration', 'تم التحقق من الرمز - يرجى إكمال التسجيل');
  } catch (error) {
    next(error);
  }
};

/**
 * Login with email and password
 * POST /api/v1/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError(
        'Email and password are required',
        'البريد الإلكتروني وكلمة المرور مطلوبين'
      );
    }

    const result = await authService.loginWithPassword(email, password);

    sendSuccess(res, {
      user: result.user,
      tokens: result.tokens,
    }, 'Login successful', 'تم تسجيل الدخول بنجاح');
  } catch (error) {
    next(error);
  }
};

/**
 * Google Sign-In
 * POST /api/v1/auth/google
 */
export const googleSignIn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { idToken, role = 'passenger' } = req.body;

    if (!idToken) {
      throw new BadRequestError('Google ID token is required', 'رمز جوجل مطلوب');
    }

    if (role !== 'passenger' && role !== 'driver') {
      throw new BadRequestError('Invalid role', 'الدور غير صحيح');
    }

    const result = await authService.googleSignIn(idToken, role);

    sendSuccess(res, {
      user: result.user,
      tokens: result.tokens,
      isNewUser: result.isNewUser,
    }, result.isNewUser ? 'Account created successfully' : 'Login successful',
       result.isNewUser ? 'تم إنشاء الحساب بنجاح' : 'تم تسجيل الدخول بنجاح');
  } catch (error) {
    next(error);
  }
};

/**
 * Register new passenger
 * POST /api/v1/auth/register/passenger
 */
export const registerPassenger = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name, phone, gender } = req.body;

    if (!email || !password || !name) {
      throw new BadRequestError(
        'Email, password, and name are required',
        'البريد الإلكتروني وكلمة المرور والاسم مطلوبين'
      );
    }

    if (password.length < 6) {
      throw new BadRequestError(
        'Password must be at least 6 characters',
        'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      );
    }

    if (name.length < 2) {
      throw new BadRequestError(
        'Name must be at least 2 characters',
        'الاسم يجب أن يكون أكثر من حرفين'
      );
    }

    const result = await authService.registerPassenger({
      email,
      password,
      name,
      phone,
      gender,
    });

    sendCreated(res, result, 'Account created successfully', 'تم إنشاء الحساب بنجاح');
  } catch (error) {
    next(error);
  }
};

/**
 * Register new driver
 * POST /api/v1/auth/register/driver
 */
export const registerDriver = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name, phone, nationalId, vehicleType, vehicleCategory, vehicle } = req.body;

    if (!email || !password || !name || !nationalId || !vehicleType || !vehicleCategory || !vehicle) {
      throw new BadRequestError(
        'All required fields must be provided',
        'جميع البيانات المطلوبة يجب ملؤها'
      );
    }

    if (password.length < 6) {
      throw new BadRequestError(
        'Password must be at least 6 characters',
        'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      );
    }

    if (nationalId.length !== 14) {
      throw new BadRequestError(
        'National ID must be 14 digits',
        'الرقم القومي يجب أن يكون 14 رقم'
      );
    }

    if (!vehicle.make || !vehicle.model || !vehicle.year || !vehicle.color || !vehicle.plateNumber) {
      throw new BadRequestError(
        'Vehicle information is incomplete',
        'بيانات المركبة غير مكتملة'
      );
    }

    const result = await authService.registerDriver({
      email,
      password,
      name,
      phone,
      nationalId,
      vehicleType,
      vehicleCategory,
      vehicle,
    });

    sendCreated(res, result, 'Driver account created - pending approval', 'تم إنشاء حساب السائق - في انتظار الموافقة');
  } catch (error) {
    next(error);
  }
};

/**
 * Admin login
 * POST /api/v1/auth/admin/login
 */
export const adminLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError(
        'Email and password are required',
        'البريد الإلكتروني وكلمة المرور مطلوبين'
      );
    }

    const result = await authService.adminLogin(email, password);
    sendSuccess(res, result, 'Login successful', 'تم تسجيل الدخول بنجاح');
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      throw new BadRequestError(
        'Email, OTP, and new password are required',
        'البريد الإلكتروني ورمز التحقق وكلمة المرور الجديدة مطلوبين'
      );
    }

    if (newPassword.length < 6) {
      throw new BadRequestError(
        'Password must be at least 6 characters',
        'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      );
    }

    await authService.resetPassword(email, otp, newPassword);
    sendSuccess(res, null, 'Password reset successfully', 'تم إعادة تعيين كلمة المرور بنجاح');
  } catch (error) {
    next(error);
  }
};

/**
 * Change password (authenticated)
 * PUT /api/v1/auth/change-password
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new BadRequestError(
        'Current and new password are required',
        'كلمة المرور الحالية والجديدة مطلوبين'
      );
    }

    if (newPassword.length < 6) {
      throw new BadRequestError(
        'Password must be at least 6 characters',
        'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      );
    }

    await authService.changePassword(req.user!.userId, currentPassword, newPassword);
    sendSuccess(res, null, 'Password changed successfully', 'تم تغيير كلمة المرور بنجاح');
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token
 * POST /api/v1/auth/refresh
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required', 'التوكن مطلوب');
    }

    const tokens = await authService.refreshToken(refreshToken);
    sendSuccess(res, { tokens }, 'Token refreshed', 'تم تجديد التوكن');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/v1/auth/profile
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await authService.getProfile(req.user!.userId);
    sendSuccess(res, { user }, 'Profile retrieved', 'تم جلب البيانات');
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/v1/auth/profile
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, phone, avatar, gender } = req.body;

    const user = await authService.updateProfile(req.user!.userId, {
      name,
      phone,
      avatar,
      gender,
    });

    sendSuccess(res, { user }, 'Profile updated', 'تم تحديث البيانات');
  } catch (error) {
    next(error);
  }
};

/**
 * Update FCM token
 * PUT /api/v1/auth/fcm-token
 */
export const updateFCMToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new BadRequestError('FCM token is required', 'التوكن مطلوب');
    }

    await authService.updateFCMToken(req.user!.userId, token);
    sendSuccess(res, null, 'FCM token updated', 'تم تحديث التوكن');
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 * POST /api/v1/auth/logout
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fcmToken } = req.body;
    await authService.logout(req.user!.userId, fcmToken);
    sendSuccess(res, null, 'Logged out successfully', 'تم تسجيل الخروج');
  } catch (error) {
    next(error);
  }
};
