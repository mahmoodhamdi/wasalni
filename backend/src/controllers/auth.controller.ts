import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { BadRequestError } from '../utils/errors';
import { validateEgyptianPhone } from '../utils/otp';

/**
 * Send OTP to phone number
 * POST /api/v1/auth/send-otp
 */
export const sendOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone } = req.body;

    if (!phone) {
      throw new BadRequestError('رقم الهاتف مطلوب');
    }

    if (!validateEgyptianPhone(phone)) {
      throw new BadRequestError('رقم الهاتف غير صحيح');
    }

    const result = await authService.sendOTP(phone);
    sendSuccess(res, result, 'تم إرسال رمز التحقق');
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP
 * POST /api/v1/auth/verify-otp
 */
export const verifyOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      throw new BadRequestError('رقم الهاتف ورمز التحقق مطلوبين');
    }

    if (otp.length !== 6) {
      throw new BadRequestError('رمز التحقق يجب أن يكون 6 أرقام');
    }

    const result = await authService.verifyOTP(phone, otp);

    if (result.isNewUser) {
      sendSuccess(res, { isNewUser: true }, 'رمز التحقق صحيح - يرجى إكمال التسجيل');
    } else {
      sendSuccess(res, {
        isNewUser: false,
        user: result.user,
        tokens: result.tokens,
      }, 'تم تسجيل الدخول بنجاح');
    }
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
    const { phone, name, email, gender } = req.body;

    if (!phone || !name) {
      throw new BadRequestError('رقم الهاتف والاسم مطلوبين');
    }

    if (name.length < 2) {
      throw new BadRequestError('الاسم يجب أن يكون أكثر من حرفين');
    }

    const result = await authService.registerPassenger({
      phone,
      name,
      email,
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
    const { phone, name, email, nationalId, vehicleType, vehicleCategory, vehicle } = req.body;

    if (!phone || !name || !nationalId || !vehicleType || !vehicleCategory || !vehicle) {
      throw new BadRequestError('جميع البيانات المطلوبة يجب ملؤها');
    }

    if (nationalId.length !== 14) {
      throw new BadRequestError('الرقم القومي يجب أن يكون 14 رقم');
    }

    if (!vehicle.make || !vehicle.model || !vehicle.year || !vehicle.color || !vehicle.plateNumber) {
      throw new BadRequestError('بيانات المركبة غير مكتملة');
    }

    const result = await authService.registerDriver({
      phone,
      name,
      email,
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
      throw new BadRequestError('البريد الإلكتروني وكلمة المرور مطلوبين');
    }

    const result = await authService.adminLogin(email, password);
    sendSuccess(res, result, 'تم تسجيل الدخول بنجاح');
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
      throw new BadRequestError('التوكن مطلوب');
    }

    const tokens = await authService.refreshToken(refreshToken);
    sendSuccess(res, { tokens }, 'تم تجديد التوكن');
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
    sendSuccess(res, { user }, 'تم جلب البيانات');
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
    const { name, email, avatar, gender } = req.body;

    const user = await authService.updateProfile(req.user!.userId, {
      name,
      email,
      avatar,
      gender,
    });

    sendSuccess(res, { user }, 'تم تحديث البيانات');
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
      throw new BadRequestError('التوكن مطلوب');
    }

    await authService.updateFCMToken(req.user!.userId, token);
    sendSuccess(res, null, 'تم تحديث التوكن');
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
    await authService.logout(req.user!.userId);
    sendSuccess(res, null, 'تم تسجيل الخروج');
  } catch (error) {
    next(error);
  }
};
