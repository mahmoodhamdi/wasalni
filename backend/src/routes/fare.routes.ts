import { Router } from 'express';
import fareController from '../controllers/fare.controller';
import {
  fareEstimateValidator,
  fareCalculateValidator,
  promoValidateValidator,
  fareSettingsUpdateValidator,
} from '../validators/fare.validator';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /fare/estimate:
 *   post:
 *     summary: Get fare estimate for a trip
 *     description: Calculates estimated fare based on pickup/dropoff locations and ride type
 *     tags: [Fare]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickup
 *               - dropoff
 *             properties:
 *               pickup:
 *                 $ref: '#/components/schemas/GeoPoint'
 *               dropoff:
 *                 $ref: '#/components/schemas/GeoPoint'
 *               rideType:
 *                 type: string
 *                 enum: [economy, comfort, family, tuktuk, motorcycle]
 *                 example: "economy"
 *     responses:
 *       200:
 *         description: Fare estimate calculated
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
 *                     estimates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rideType:
 *                             type: string
 *                             example: "economy"
 *                           fare:
 *                             type: number
 *                             example: 55
 *                           distance:
 *                             type: number
 *                             example: 12.5
 *                           duration:
 *                             type: number
 *                             example: 25
 *                           breakdown:
 *                             $ref: '#/components/schemas/FareBreakdown'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/estimate', fareEstimateValidator, fareController.getFareEstimate);

/**
 * @swagger
 * /fare/calculate:
 *   post:
 *     summary: Calculate final fare for a trip
 *     description: Calculates the final fare including any applicable surge or discounts
 *     tags: [Fare]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickup
 *               - dropoff
 *               - rideType
 *             properties:
 *               pickup:
 *                 $ref: '#/components/schemas/GeoPoint'
 *               dropoff:
 *                 $ref: '#/components/schemas/GeoPoint'
 *               rideType:
 *                 type: string
 *                 enum: [economy, comfort, family, tuktuk, motorcycle]
 *               promoCode:
 *                 type: string
 *                 example: "WELCOME50"
 *     responses:
 *       200:
 *         description: Final fare calculated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FareBreakdown'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/calculate',
  authenticate,
  fareCalculateValidator,
  fareController.calculateFare
);

/**
 * @swagger
 * /fare/settings:
 *   get:
 *     summary: Get all fare settings
 *     description: Returns fare configuration for all vehicle types
 *     tags: [Fare]
 *     security: []
 *     responses:
 *       200:
 *         description: Fare settings retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FareSettings'
 */
router.get('/settings', fareController.getFareSettings);

/**
 * @swagger
 * /fare/settings/{rideType}:
 *   put:
 *     summary: Update fare settings
 *     description: Updates fare configuration for a specific vehicle type (Admin only)
 *     tags: [Fare, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [economy, comfort, family, tuktuk, motorcycle]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               baseFare:
 *                 type: number
 *                 example: 12
 *               perKmRate:
 *                 type: number
 *                 example: 3.5
 *               perMinuteRate:
 *                 type: number
 *                 example: 0.5
 *               minimumFare:
 *                 type: number
 *                 example: 18
 *               cancellationFee:
 *                 type: number
 *                 example: 10
 *               platformFeePercentage:
 *                 type: number
 *                 example: 20
 *     responses:
 *       200:
 *         description: Fare settings updated
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
 *                   example: "Fare settings updated"
 *                 messageAr:
 *                   type: string
 *                   example: "تم تحديث إعدادات الأجرة"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put(
  '/settings/:rideType',
  authenticate,
  authorize('admin'),
  fareSettingsUpdateValidator,
  fareController.updateFareSettings
);

/**
 * @swagger
 * /fare/surge:
 *   get:
 *     summary: Get current surge info
 *     description: Returns current surge multipliers for all zones
 *     tags: [Fare]
 *     security: []
 *     responses:
 *       200:
 *         description: Surge info retrieved
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
 *                     isActive:
 *                       type: boolean
 *                       example: false
 *                     multiplier:
 *                       type: number
 *                       example: 1.0
 *                     zones:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Zone'
 */
router.get('/surge', fareController.getSurgeInfo);

/**
 * @swagger
 * /fare/promo/validate:
 *   post:
 *     summary: Validate a promo code
 *     description: Checks if a promo code is valid and returns discount info
 *     tags: [Fare, Promo]
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
 *             properties:
 *               code:
 *                 type: string
 *                 example: "WELCOME50"
 *               fare:
 *                 type: number
 *                 example: 50
 *               rideType:
 *                 type: string
 *                 enum: [economy, comfort, family, tuktuk, motorcycle]
 *     responses:
 *       200:
 *         description: Promo code validated
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
 *                     valid:
 *                       type: boolean
 *                       example: true
 *                     discount:
 *                       type: number
 *                       example: 25
 *                     finalFare:
 *                       type: number
 *                       example: 25
 *       400:
 *         description: Invalid or expired promo code
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/promo/validate',
  authenticate,
  promoValidateValidator,
  fareController.validatePromoCode
);

export default router;
