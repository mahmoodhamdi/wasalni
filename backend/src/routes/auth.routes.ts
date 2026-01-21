import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  sendOTP,
  verifyLoginOTP,
  verifyRegistrationOTP,
  login,
  googleSignIn,
  registerPassenger,
  registerDriver,
  adminLogin,
  resetPassword,
  changePassword,
  refreshToken,
  getProfile,
  updateProfile,
  updateFCMToken,
  logout,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Rate limiters
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: 'Too many OTP requests, please try again later',
    messageAr: 'طلبات كثيرة جداً، يرجى المحاولة بعد ساعة',
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
    messageAr: 'محاولات دخول كثيرة، يرجى المحاولة لاحقاً',
  },
});

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send OTP to email
 *     description: Sends a 6-digit OTP code to the provided email for verification
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
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               purpose:
 *                 type: string
 *                 enum: [registration, login, password_reset]
 *                 default: login
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/send-otp', otpLimiter, sendOTP);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP for login
 *     description: Verifies the OTP code and returns authentication tokens
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
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/verify-otp', loginLimiter, verifyLoginOTP);

/**
 * @swagger
 * /auth/verify-registration-otp:
 *   post:
 *     summary: Verify OTP for registration
 *     description: Verifies the OTP code before completing registration
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
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/verify-registration-otp', verifyRegistrationOTP);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     description: Authenticates user with email and password
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
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/login', loginLimiter, login);

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Google Sign-In
 *     description: Authenticate or register with Google
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token from Google Sign-In
 *               role:
 *                 type: string
 *                 enum: [passenger, driver]
 *                 default: passenger
 *     responses:
 *       200:
 *         description: Authentication successful
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/google', googleSignIn);

/**
 * @swagger
 * /auth/register/passenger:
 *   post:
 *     summary: Register a new passenger
 *     description: Creates a new passenger account (requires email OTP verification first)
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
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *                 example: "Ahmed Mohamed"
 *               phone:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *     responses:
 *       201:
 *         description: Passenger registered successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/register/passenger', registerPassenger);

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
 *               - email
 *               - password
 *               - name
 *               - nationalId
 *               - vehicleType
 *               - vehicleCategory
 *               - vehicle
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               nationalId:
 *                 type: string
 *               vehicleType:
 *                 type: string
 *                 enum: [car, tuktuk, motorcycle]
 *               vehicleCategory:
 *                 type: string
 *                 enum: [economy, comfort, family]
 *               vehicle:
 *                 type: object
 *                 properties:
 *                   make:
 *                     type: string
 *                   model:
 *                     type: string
 *                   year:
 *                     type: integer
 *                   color:
 *                     type: string
 *                   plateNumber:
 *                     type: string
 *     responses:
 *       201:
 *         description: Driver registration submitted
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/register/driver', registerDriver);

/**
 * @swagger
 * /auth/admin/login:
 *   post:
 *     summary: Admin login
 *     description: Authenticates admin users with email/password
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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/admin/login', loginLimiter, adminLogin);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     description: Resets the user password using OTP verification
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
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/reset-password', resetPassword);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change password
 *     description: Changes password for authenticated user
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
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/change-password', authenticate, changePassword);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
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
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/refresh', refreshToken);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/profile', authenticate, getProfile);

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update user profile
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
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/profile', authenticate, updateProfile);

/**
 * @swagger
 * /auth/fcm-token:
 *   put:
 *     summary: Update FCM token
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
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: FCM token updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/fcm-token', authenticate, updateFCMToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fcmToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout', authenticate, logout);

export default router;
