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
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send OTP to phone number
 *     description: Sends a 6-digit OTP code to the provided phone number for verification
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+201111111111"
 *                 description: Phone number with country code
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP sent successfully"
 *                 messageAr:
 *                   type: string
 *                   example: "تم إرسال رمز التحقق بنجاح"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/send-otp', otpLimiter, sendOTPValidator, validate, sendOTP);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP and authenticate user
 *     description: Verifies the OTP code and returns authentication tokens if successful
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - code
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+201111111111"
 *               code:
 *                 type: string
 *                 example: "123456"
 *                 description: 6-digit OTP code
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP verified successfully"
 *                 messageAr:
 *                   type: string
 *                   example: "تم التحقق من رمز التحقق بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     isNewUser:
 *                       type: boolean
 *                       example: false
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/verify-otp', loginLimiter, verifyOTPValidator, validate, verifyOTP);

/**
 * @swagger
 * /auth/register/passenger:
 *   post:
 *     summary: Register a new passenger
 *     description: Creates a new passenger account after phone verification
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - name
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+201111111111"
 *               name:
 *                 type: string
 *                 example: "أحمد محمد"
 *               email:
 *                 type: string
 *                 example: "ahmed@example.com"
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *                 example: "male"
 *     responses:
 *       201:
 *         description: Passenger registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Registration successful"
 *                 messageAr:
 *                   type: string
 *                   example: "تم التسجيل بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/Passenger'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: User already exists
 */
router.post('/register/passenger', registerPassengerValidator, validate, registerPassenger);

/**
 * @swagger
 * /auth/register/driver:
 *   post:
 *     summary: Register a new driver
 *     description: Creates a new driver account pending admin approval
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - name
 *               - vehicleType
 *               - vehicleMake
 *               - vehicleModel
 *               - vehicleYear
 *               - vehicleColor
 *               - vehiclePlate
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+201222222222"
 *               name:
 *                 type: string
 *                 example: "محمد علي"
 *               vehicleType:
 *                 type: string
 *                 enum: [economy, comfort, family, tuktuk, motorcycle]
 *                 example: "economy"
 *               vehicleMake:
 *                 type: string
 *                 example: "Toyota"
 *               vehicleModel:
 *                 type: string
 *                 example: "Corolla"
 *               vehicleYear:
 *                 type: integer
 *                 example: 2020
 *               vehicleColor:
 *                 type: string
 *                 example: "أبيض"
 *               vehiclePlate:
 *                 type: string
 *                 example: "أ ب ج 1234"
 *     responses:
 *       201:
 *         description: Driver registration submitted for approval
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Registration submitted for approval"
 *                 messageAr:
 *                   type: string
 *                   example: "تم تقديم طلب التسجيل للمراجعة"
 *                 data:
 *                   type: object
 *                   properties:
 *                     driver:
 *                       $ref: '#/components/schemas/Driver'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/register/driver', registerDriverValidator, validate, registerDriver);

/**
 * @swagger
 * /auth/admin/login:
 *   post:
 *     summary: Admin login with email and password
 *     description: Authenticates admin users with email/password credentials
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@wasalni.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "admin123"
 *     responses:
 *       200:
 *         description: Admin login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 messageAr:
 *                   type: string
 *                   example: "تم تسجيل الدخول بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/admin/login', loginLimiter, adminLoginValidator, validate, adminLogin);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using a valid refresh token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/refresh', refreshTokenValidator, validate, refreshToken);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile information
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/profile', authenticate, getProfile);

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update user profile
 *     description: Updates the authenticated user's profile information
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "أحمد محمد"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ahmed@example.com"
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 messageAr:
 *                   type: string
 *                   example: "تم تحديث الملف الشخصي بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.put('/profile', authenticate, updateProfileValidator, validate, updateProfile);

/**
 * @swagger
 * /auth/fcm-token:
 *   put:
 *     summary: Update FCM token
 *     description: Updates the Firebase Cloud Messaging token for push notifications
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 example: "dGVzdF9mY21fdG9rZW4..."
 *     responses:
 *       200:
 *         description: FCM token updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "FCM token updated"
 *                 messageAr:
 *                   type: string
 *                   example: "تم تحديث رمز الإشعارات"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/fcm-token', authenticate, fcmTokenValidator, validate, updateFCMToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Invalidates the current session and clears FCM token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *                 messageAr:
 *                   type: string
 *                   example: "تم تسجيل الخروج بنجاح"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout', authenticate, logout);

export default router;
