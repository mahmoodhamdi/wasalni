import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  sendOTP,
  verifyOTP,
  registerPassenger,
  registerDriver,
  adminLogin,
  refreshToken,
  getProfile,
  updateProfile,
  updateFCMToken,
  logout,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  sendOTPValidator,
  verifyOTPValidator,
  registerPassengerValidator,
  registerDriverValidator,
  adminLoginValidator,
  refreshTokenValidator,
  updateProfileValidator,
  fcmTokenValidator,
  validate,
} from '../validators/auth.validator';

const router = Router();

// Auth-specific rate limiters
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 OTP requests per hour per IP
  message: {
    success: false,
    message: 'Too many OTP requests, please try again later',
    messageAr: 'طلبات كثيرة جداً، يرجى المحاولة بعد ساعة',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
    messageAr: 'محاولات دخول كثيرة، يرجى المحاولة لاحقاً',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/v1/auth/send-otp
 * @desc    Send OTP to phone number
 * @access  Public
 */
router.post('/send-otp', otpLimiter, sendOTPValidator, validate, sendOTP);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP and authenticate user
 * @access  Public
 */
router.post('/verify-otp', loginLimiter, verifyOTPValidator, validate, verifyOTP);

/**
 * @route   POST /api/v1/auth/register/passenger
 * @desc    Register new passenger
 * @access  Public
 */
router.post('/register/passenger', registerPassengerValidator, validate, registerPassenger);

/**
 * @route   POST /api/v1/auth/register/driver
 * @desc    Register new driver
 * @access  Public
 */
router.post('/register/driver', registerDriverValidator, validate, registerDriver);

/**
 * @route   POST /api/v1/auth/admin/login
 * @desc    Admin login with email/password
 * @access  Public
 */
router.post('/admin/login', loginLimiter, adminLoginValidator, validate, adminLogin);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshTokenValidator, validate, refreshToken);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, updateProfileValidator, validate, updateProfile);

/**
 * @route   PUT /api/v1/auth/fcm-token
 * @desc    Update FCM token for push notifications
 * @access  Private
 */
router.put('/fcm-token', authenticate, fcmTokenValidator, validate, updateFCMToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, logout);

export default router;
