import { body, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { BadRequestError } from '../utils/errors';

/**
 * Validation middleware - checks for validation errors
 */
export const validate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    throw new BadRequestError(messages.join(', '), messages.join(', '));
  }
  next();
};

/**
 * Validate Egyptian phone number format
 */
const egyptianPhoneValidator = (value: string): boolean => {
  // Accept formats: +201xxxxxxxxx, 01xxxxxxxxx, 201xxxxxxxxx
  const normalized = value.replace(/[\s-]/g, '');
  return /^(\+?20)?1[0125][0-9]{8}$/.test(normalized);
};

/**
 * Send OTP validation
 */
export const sendOTPValidator: ValidationChain[] = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('رقم الهاتف مطلوب')
    .custom(egyptianPhoneValidator)
    .withMessage('رقم الهاتف غير صحيح'),
];

/**
 * Verify OTP validation
 */
export const verifyOTPValidator: ValidationChain[] = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('رقم الهاتف مطلوب')
    .custom(egyptianPhoneValidator)
    .withMessage('رقم الهاتف غير صحيح'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('رمز التحقق مطلوب')
    .isLength({ min: 6, max: 6 })
    .withMessage('رمز التحقق يجب أن يكون 6 أرقام')
    .isNumeric()
    .withMessage('رمز التحقق يجب أن يكون أرقام فقط'),
];

/**
 * Register passenger validation
 */
export const registerPassengerValidator: ValidationChain[] = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('رقم الهاتف مطلوب')
    .custom(egyptianPhoneValidator)
    .withMessage('رقم الهاتف غير صحيح'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('الاسم مطلوب')
    .isLength({ min: 2, max: 50 })
    .withMessage('الاسم يجب أن يكون بين 2 و 50 حرف'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('البريد الإلكتروني غير صحيح')
    .normalizeEmail(),
  body('gender')
    .optional()
    .isIn(['male', 'female'])
    .withMessage('الجنس يجب أن يكون male أو female'),
];

/**
 * Register driver validation
 */
export const registerDriverValidator: ValidationChain[] = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('رقم الهاتف مطلوب')
    .custom(egyptianPhoneValidator)
    .withMessage('رقم الهاتف غير صحيح'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('الاسم مطلوب')
    .isLength({ min: 2, max: 50 })
    .withMessage('الاسم يجب أن يكون بين 2 و 50 حرف'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('البريد الإلكتروني غير صحيح')
    .normalizeEmail(),
  body('nationalId')
    .trim()
    .notEmpty()
    .withMessage('الرقم القومي مطلوب')
    .isLength({ min: 14, max: 14 })
    .withMessage('الرقم القومي يجب أن يكون 14 رقم')
    .isNumeric()
    .withMessage('الرقم القومي يجب أن يكون أرقام فقط'),
  body('vehicleType')
    .trim()
    .notEmpty()
    .withMessage('نوع المركبة مطلوب')
    .isIn(['car', 'tuktuk', 'motorcycle'])
    .withMessage('نوع المركبة غير صحيح'),
  body('vehicleCategory')
    .trim()
    .notEmpty()
    .withMessage('فئة المركبة مطلوبة')
    .isIn(['economy', 'comfort', 'family'])
    .withMessage('فئة المركبة غير صحيحة'),
  body('vehicle.make')
    .trim()
    .notEmpty()
    .withMessage('ماركة المركبة مطلوبة'),
  body('vehicle.model')
    .trim()
    .notEmpty()
    .withMessage('موديل المركبة مطلوب'),
  body('vehicle.year')
    .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
    .withMessage('سنة الصنع غير صحيحة'),
  body('vehicle.color')
    .trim()
    .notEmpty()
    .withMessage('لون المركبة مطلوب'),
  body('vehicle.plateNumber')
    .trim()
    .notEmpty()
    .withMessage('رقم اللوحة مطلوب'),
];

/**
 * Admin login validation
 */
export const adminLoginValidator: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('البريد الإلكتروني مطلوب')
    .isEmail()
    .withMessage('البريد الإلكتروني غير صحيح')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6 })
    .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
];

/**
 * Refresh token validation
 */
export const refreshTokenValidator: ValidationChain[] = [
  body('refreshToken')
    .trim()
    .notEmpty()
    .withMessage('التوكن مطلوب'),
];

/**
 * Update profile validation
 */
export const updateProfileValidator: ValidationChain[] = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('الاسم يجب أن يكون بين 2 و 50 حرف'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('البريد الإلكتروني غير صحيح')
    .normalizeEmail(),
  body('gender')
    .optional()
    .isIn(['male', 'female'])
    .withMessage('الجنس يجب أن يكون male أو female'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('رابط الصورة غير صحيح'),
];

/**
 * FCM token validation
 */
export const fcmTokenValidator: ValidationChain[] = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('التوكن مطلوب'),
];
