import { Router } from 'express';
import { authenticate, adminOnly, anyRole } from '../middleware/auth.middleware';
import promoController from '../controllers/promo.controller';
import {
  validatePromoValidator,
  createPromoValidator,
  updatePromoValidator,
  getPromoByIdValidator,
  availablePromosValidator,
} from '../validators/promo.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Promo
 *     description: Promo code management for users
 *   - name: Promo (Admin)
 *     description: Admin promo code management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PromoCode:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Promo code ID
 *           example: "60f7c8b9e1d5f82a4c9b1234"
 *         code:
 *           type: string
 *           description: The promo code string
 *           example: "WELCOME50"
 *         type:
 *           type: string
 *           enum: [percentage, fixed]
 *           description: Type of discount
 *           example: "percentage"
 *         value:
 *           type: number
 *           description: Discount value (percentage or fixed amount)
 *           example: 50
 *         maxDiscount:
 *           type: number
 *           description: Maximum discount amount for percentage type
 *           example: 100
 *         minFare:
 *           type: number
 *           description: Minimum fare required to use promo
 *           example: 50
 *         usageLimit:
 *           type: integer
 *           description: Total number of times this promo can be used
 *           example: 1000
 *         usageCount:
 *           type: integer
 *           description: Number of times this promo has been used
 *           example: 150
 *         perUserLimit:
 *           type: integer
 *           description: Maximum times a single user can use this promo
 *           example: 1
 *         validFrom:
 *           type: string
 *           format: date-time
 *           description: Start date of promo validity
 *           example: "2024-01-01T00:00:00.000Z"
 *         validUntil:
 *           type: string
 *           format: date-time
 *           description: End date of promo validity
 *           example: "2024-12-31T23:59:59.000Z"
 *         rideTypes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [economy, comfort, family, tuktuk, motorcycle]
 *           description: Applicable ride types
 *           example: ["economy", "comfort"]
 *         newUsersOnly:
 *           type: boolean
 *           description: Whether promo is only for new users
 *           example: true
 *         isActive:
 *           type: boolean
 *           description: Whether promo is currently active
 *           example: true
 *         createdBy:
 *           type: string
 *           description: Admin user ID who created the promo
 *           example: "60f7c8b9e1d5f82a4c9b5678"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *     PromoValidationResult:
 *       type: object
 *       properties:
 *         valid:
 *           type: boolean
 *           description: Whether the promo code is valid
 *           example: true
 *         discount:
 *           type: number
 *           description: Calculated discount amount
 *           example: 25
 *         discountType:
 *           type: string
 *           enum: [percentage, fixed]
 *           description: Type of discount applied
 *           example: "percentage"
 *         promoCode:
 *           type: string
 *           description: The validated promo code
 *           example: "WELCOME50"
 *     PromoUsageHistory:
 *       type: object
 *       properties:
 *         promoId:
 *           type: string
 *           description: Promo code ID
 *           example: "60f7c8b9e1d5f82a4c9b1234"
 *         code:
 *           type: string
 *           description: Promo code string
 *           example: "WELCOME50"
 *         tripId:
 *           type: string
 *           description: Trip ID where promo was used
 *           example: "60f7c8b9e1d5f82a4c9b9999"
 *         discount:
 *           type: number
 *           description: Discount amount applied
 *           example: 25
 *         usedAt:
 *           type: string
 *           format: date-time
 *           description: When the promo was used
 *           example: "2024-01-20T14:30:00.000Z"
 *     PromoStats:
 *       type: object
 *       properties:
 *         totalUsage:
 *           type: integer
 *           description: Total number of times promo was used
 *           example: 150
 *         totalDiscount:
 *           type: number
 *           description: Total discount amount given
 *           example: 7500
 *         uniqueUsers:
 *           type: integer
 *           description: Number of unique users who used the promo
 *           example: 120
 *         averageDiscount:
 *           type: number
 *           description: Average discount per usage
 *           example: 50
 *         usageByRideType:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *           description: Usage breakdown by ride type
 *           example:
 *             economy: 80
 *             comfort: 50
 *             family: 20
 */

// ==================== User Routes ====================

/**
 * @swagger
 * /promo/validate:
 *   post:
 *     summary: Validate promo code
 *     description: Validates a promo code for a specific fare and ride type, returning discount information if valid
 *     tags: [Promo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - fare
 *               - rideType
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 pattern: "^[A-Za-z0-9]+$"
 *                 description: Promo code to validate
 *                 example: "WELCOME50"
 *               fare:
 *                 type: number
 *                 minimum: 0
 *                 description: Fare amount to calculate discount for
 *                 example: 100
 *               rideType:
 *                 type: string
 *                 enum: [economy, comfort, family, tuktuk, motorcycle]
 *                 description: Type of ride
 *                 example: "economy"
 *     responses:
 *       200:
 *         description: Promo code validated successfully
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
 *                   example: "Promo code applied successfully"
 *                 messageAr:
 *                   type: string
 *                   example: "تم تطبيق كود الخصم بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/PromoValidationResult'
 *       400:
 *         description: Invalid promo code or validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Promo code has expired"
 *                 messageAr:
 *                   type: string
 *                   example: "انتهت صلاحية كود الخصم"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to validate promo code"
 *                 messageAr:
 *                   type: string
 *                   example: "فشل التحقق من كود الخصم"
 */
router.post(
  '/validate',
  authenticate,
  anyRole,
  validatePromoValidator,
  promoController.validatePromo
);

/**
 * @swagger
 * /promo/available:
 *   get:
 *     summary: Get available promo codes
 *     description: Returns a list of promo codes available to the authenticated user, optionally filtered by ride type and fare
 *     tags: [Promo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rideType
 *         schema:
 *           type: string
 *           enum: [economy, comfort, family, tuktuk, motorcycle]
 *         description: Filter promos by ride type
 *         example: "economy"
 *       - in: query
 *         name: fare
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Filter promos by minimum fare requirement
 *         example: 100
 *     responses:
 *       200:
 *         description: Available promos retrieved successfully
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
 *                   example: "Promos retrieved"
 *                 messageAr:
 *                   type: string
 *                   example: "تم استرجاع العروض"
 *                 data:
 *                   type: object
 *                   properties:
 *                     promos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PromoCode'
 *                     count:
 *                       type: integer
 *                       description: Number of available promos
 *                       example: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get promos"
 *                 messageAr:
 *                   type: string
 *                   example: "فشل استرجاع العروض"
 */
router.get(
  '/available',
  authenticate,
  anyRole,
  availablePromosValidator,
  promoController.getAvailablePromos
);

/**
 * @swagger
 * /promo/history:
 *   get:
 *     summary: Get promo usage history
 *     description: Returns the authenticated user's promo code usage history with pagination
 *     tags: [Promo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *         example: 20
 *     responses:
 *       200:
 *         description: Usage history retrieved successfully
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
 *                   example: "Usage history retrieved"
 *                 messageAr:
 *                   type: string
 *                   example: "تم استرجاع سجل الاستخدام"
 *                 data:
 *                   type: object
 *                   properties:
 *                     history:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PromoUsageHistory'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 45
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get usage history"
 *                 messageAr:
 *                   type: string
 *                   example: "فشل استرجاع سجل الاستخدام"
 */
router.get('/history', authenticate, anyRole, promoController.getPromoHistory);

// ==================== Admin Routes ====================

/**
 * @swagger
 * /promo:
 *   post:
 *     summary: Create promo code (Admin)
 *     description: Creates a new promo code with specified parameters. Admin only.
 *     tags: [Promo (Admin)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - type
 *               - value
 *               - validFrom
 *               - validUntil
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 pattern: "^[A-Za-z0-9]+$"
 *                 description: Unique promo code
 *                 example: "SUMMER2024"
 *               type:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 description: Type of discount
 *                 example: "percentage"
 *               value:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Discount value (1-100 for percentage, any positive for fixed)
 *                 example: 25
 *               maxDiscount:
 *                 type: number
 *                 minimum: 0
 *                 description: Maximum discount amount for percentage type
 *                 example: 50
 *               minFare:
 *                 type: number
 *                 minimum: 0
 *                 description: Minimum fare required to use promo
 *                 example: 30
 *               usageLimit:
 *                 type: integer
 *                 minimum: 1
 *                 description: Total usage limit for this promo
 *                 example: 500
 *               perUserLimit:
 *                 type: integer
 *                 minimum: 1
 *                 description: Maximum uses per user
 *                 example: 2
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *                 description: Start date of promo validity (ISO 8601)
 *                 example: "2024-06-01T00:00:00.000Z"
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 description: End date of promo validity (ISO 8601)
 *                 example: "2024-08-31T23:59:59.000Z"
 *               rideTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [economy, comfort, family, tuktuk, motorcycle]
 *                 description: Applicable ride types (empty means all)
 *                 example: ["economy", "comfort"]
 *               newUsersOnly:
 *                 type: boolean
 *                 description: Restrict to new users only
 *                 example: false
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific user IDs this promo is restricted to
 *                 example: ["60f7c8b9e1d5f82a4c9b1111", "60f7c8b9e1d5f82a4c9b2222"]
 *     responses:
 *       201:
 *         description: Promo code created successfully
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
 *                   example: "Promo code created"
 *                 messageAr:
 *                   type: string
 *                   example: "تم إنشاء كود الخصم"
 *                 data:
 *                   type: object
 *                   properties:
 *                     promo:
 *                       $ref: '#/components/schemas/PromoCode'
 *       400:
 *         description: Validation failed or promo code already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Promo code already exists"
 *                 messageAr:
 *                   type: string
 *                   example: "كود الخصم موجود بالفعل"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  '/',
  authenticate,
  adminOnly,
  createPromoValidator,
  promoController.createPromo
);

/**
 * @swagger
 * /promo:
 *   get:
 *     summary: Get all promo codes (Admin)
 *     description: Returns a paginated list of all promo codes with optional filtering. Admin only.
 *     tags: [Promo (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *         example: 20
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *         example: true
 *     responses:
 *       200:
 *         description: Promo codes retrieved successfully
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
 *                   example: "Promo codes retrieved"
 *                 messageAr:
 *                   type: string
 *                   example: "تم استرجاع أكواد الخصم"
 *                 data:
 *                   type: object
 *                   properties:
 *                     promos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PromoCode'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 50
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get promo codes"
 *                 messageAr:
 *                   type: string
 *                   example: "فشل استرجاع أكواد الخصم"
 */
router.get('/', authenticate, adminOnly, promoController.getAllPromos);

/**
 * @swagger
 * /promo/{promoId}:
 *   get:
 *     summary: Get promo code by ID (Admin)
 *     description: Returns detailed information about a specific promo code. Admin only.
 *     tags: [Promo (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: promoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Promo code MongoDB ID
 *         example: "60f7c8b9e1d5f82a4c9b1234"
 *     responses:
 *       200:
 *         description: Promo code retrieved successfully
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
 *                   example: "Promo code retrieved"
 *                 messageAr:
 *                   type: string
 *                   example: "تم استرجاع كود الخصم"
 *                 data:
 *                   type: object
 *                   properties:
 *                     promo:
 *                       $ref: '#/components/schemas/PromoCode'
 *       400:
 *         description: Invalid promo ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid promo ID"
 *                 messageAr:
 *                   type: string
 *                   example: "معرف الكود غير صالح"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Promo code not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Promo code not found"
 *                 messageAr:
 *                   type: string
 *                   example: "لم يتم العثور على كود الخصم"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get promo code"
 *                 messageAr:
 *                   type: string
 *                   example: "فشل استرجاع كود الخصم"
 */
router.get(
  '/:promoId',
  authenticate,
  adminOnly,
  getPromoByIdValidator,
  promoController.getPromoById
);

/**
 * @swagger
 * /promo/{promoId}/stats:
 *   get:
 *     summary: Get promo code statistics (Admin)
 *     description: Returns usage statistics for a specific promo code including total usage, discount amounts, and breakdown by ride type. Admin only.
 *     tags: [Promo (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: promoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Promo code MongoDB ID
 *         example: "60f7c8b9e1d5f82a4c9b1234"
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                   example: "Stats retrieved"
 *                 messageAr:
 *                   type: string
 *                   example: "تم استرجاع الإحصائيات"
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       $ref: '#/components/schemas/PromoStats'
 *       400:
 *         description: Invalid promo ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid promo ID"
 *                 messageAr:
 *                   type: string
 *                   example: "معرف الكود غير صالح"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get stats"
 *                 messageAr:
 *                   type: string
 *                   example: "فشل استرجاع الإحصائيات"
 */
router.get(
  '/:promoId/stats',
  authenticate,
  adminOnly,
  getPromoByIdValidator,
  promoController.getPromoStats
);

/**
 * @swagger
 * /promo/{promoId}:
 *   put:
 *     summary: Update promo code (Admin)
 *     description: Updates an existing promo code with new values. Admin only.
 *     tags: [Promo (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: promoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Promo code MongoDB ID
 *         example: "60f7c8b9e1d5f82a4c9b1234"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 pattern: "^[A-Za-z0-9]+$"
 *                 description: Updated promo code
 *                 example: "SUMMER2024V2"
 *               type:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 description: Updated discount type
 *                 example: "fixed"
 *               value:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Updated discount value
 *                 example: 30
 *               maxDiscount:
 *                 type: number
 *                 minimum: 0
 *                 description: Updated maximum discount
 *                 example: 75
 *               minFare:
 *                 type: number
 *                 minimum: 0
 *                 description: Updated minimum fare
 *                 example: 40
 *               usageLimit:
 *                 type: integer
 *                 minimum: 1
 *                 description: Updated total usage limit
 *                 example: 1000
 *               perUserLimit:
 *                 type: integer
 *                 minimum: 1
 *                 description: Updated per user limit
 *                 example: 3
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *                 description: Updated start date
 *                 example: "2024-07-01T00:00:00.000Z"
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 description: Updated end date
 *                 example: "2024-09-30T23:59:59.000Z"
 *               rideTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [economy, comfort, family, tuktuk, motorcycle]
 *                 description: Updated applicable ride types
 *                 example: ["economy", "comfort", "family"]
 *               newUsersOnly:
 *                 type: boolean
 *                 description: Updated new users only flag
 *                 example: true
 *               isActive:
 *                 type: boolean
 *                 description: Updated active status
 *                 example: true
 *     responses:
 *       200:
 *         description: Promo code updated successfully
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
 *                   example: "Promo code updated"
 *                 messageAr:
 *                   type: string
 *                   example: "تم تحديث كود الخصم"
 *                 data:
 *                   type: object
 *                   properties:
 *                     promo:
 *                       $ref: '#/components/schemas/PromoCode'
 *       400:
 *         description: Validation failed or invalid promo ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 messageAr:
 *                   type: string
 *                   example: "فشل التحقق من البيانات"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put(
  '/:promoId',
  authenticate,
  adminOnly,
  updatePromoValidator,
  promoController.updatePromo
);

/**
 * @swagger
 * /promo/{promoId}:
 *   delete:
 *     summary: Deactivate promo code (Admin)
 *     description: Deactivates (soft deletes) a promo code. The promo will no longer be usable but remains in the database for historical records. Admin only.
 *     tags: [Promo (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: promoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Promo code MongoDB ID
 *         example: "60f7c8b9e1d5f82a4c9b1234"
 *     responses:
 *       200:
 *         description: Promo code deactivated successfully
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
 *                   example: "Promo code deactivated"
 *                 messageAr:
 *                   type: string
 *                   example: "تم إلغاء تفعيل كود الخصم"
 *                 data:
 *                   type: object
 *                   properties:
 *                     promo:
 *                       $ref: '#/components/schemas/PromoCode'
 *       400:
 *         description: Invalid promo ID or promo already deactivated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid promo ID"
 *                 messageAr:
 *                   type: string
 *                   example: "معرف الكود غير صالح"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete(
  '/:promoId',
  authenticate,
  adminOnly,
  getPromoByIdValidator,
  promoController.deactivatePromo
);

export default router;
