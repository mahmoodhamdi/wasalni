import { Router } from 'express';
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

const router = Router();

/**
 * @route   POST /api/v1/auth/send-otp
 * @desc    Send OTP to phone number
 * @access  Public
 */
router.post('/send-otp', sendOTP);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP and authenticate user
 * @access  Public
 */
router.post('/verify-otp', verifyOTP);

/**
 * @route   POST /api/v1/auth/register/passenger
 * @desc    Register new passenger
 * @access  Public
 */
router.post('/register/passenger', registerPassenger);

/**
 * @route   POST /api/v1/auth/register/driver
 * @desc    Register new driver
 * @access  Public
 */
router.post('/register/driver', registerDriver);

/**
 * @route   POST /api/v1/auth/admin/login
 * @desc    Admin login with email/password
 * @access  Public
 */
router.post('/admin/login', adminLogin);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshToken);

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
router.put('/profile', authenticate, updateProfile);

/**
 * @route   PUT /api/v1/auth/fcm-token
 * @desc    Update FCM token for push notifications
 * @access  Private
 */
router.put('/fcm-token', authenticate, updateFCMToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, logout);

export default router;
