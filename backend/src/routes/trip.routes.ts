import { Router } from 'express';
import tripController from '../controllers/trip.controller';
import {
  createTripValidator,
  tripIdValidator,
  cancelTripValidator,
  rateTripValidator,
  shareTripValidator,
  tripListValidator,
  driverTripActionValidator,
} from '../validators/trip.validator';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// ==================== Passenger Routes ====================

/**
 * @swagger
 * /trips:
 *   post:
 *     summary: Create a new trip
 *     description: Creates a new trip request and starts searching for available drivers
 *     tags: [Trip]
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
 *               - paymentMethod
 *             properties:
 *               pickup:
 *                 $ref: '#/components/schemas/Location'
 *               dropoff:
 *                 $ref: '#/components/schemas/Location'
 *               rideType:
 *                 type: string
 *                 enum: [economy, comfort, family, tuktuk, motorcycle]
 *                 example: "economy"
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, wallet]
 *                 example: "cash"
 *               promoCode:
 *                 type: string
 *                 example: "WELCOME50"
 *               notes:
 *                 type: string
 *                 example: "عند البوابة الرئيسية"
 *     responses:
 *       201:
 *         description: Trip created successfully
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
 *                   example: "Trip created successfully"
 *                 messageAr:
 *                   type: string
 *                   example: "تم إنشاء الرحلة بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Trip'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/',
  authenticate,
  authorize('passenger'),
  createTripValidator,
  tripController.createTrip
);

/**
 * @swagger
 * /trips:
 *   get:
 *     summary: Get passenger trips history
 *     description: Returns paginated list of trips for the authenticated passenger
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, cancelled, all]
 *         description: Filter by trip status
 *     responses:
 *       200:
 *         description: Trips retrieved successfully
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
 *                     $ref: '#/components/schemas/Trip'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/',
  authenticate,
  authorize('passenger'),
  tripListValidator,
  tripController.getPassengerTrips
);

/**
 * @swagger
 * /trips/history:
 *   get:
 *     summary: Get trip history
 *     description: Returns paginated list of completed/cancelled trips
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Trip history retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/history',
  authenticate,
  tripListValidator,
  tripController.getPassengerTrips
);

/**
 * @swagger
 * /trips/active:
 *   get:
 *     summary: Get active trip for passenger
 *     description: Returns the current active trip if any exists
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active trip retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Trip'
 *       404:
 *         description: No active trip found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/active',
  authenticate,
  authorize('passenger'),
  tripController.getActiveTrip
);

/**
 * @swagger
 * /trips/{tripId}:
 *   get:
 *     summary: Get trip by ID
 *     description: Returns detailed information about a specific trip
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: The trip ID
 *     responses:
 *       200:
 *         description: Trip details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Trip'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/:tripId',
  authenticate,
  tripIdValidator,
  tripController.getTrip
);

/**
 * @swagger
 * /trips/{tripId}/cancel:
 *   put:
 *     summary: Cancel a trip
 *     description: Cancels a pending or active trip
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "تغيرت خططي"
 *     responses:
 *       200:
 *         description: Trip cancelled successfully
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
 *                   example: "Trip cancelled successfully"
 *                 messageAr:
 *                   type: string
 *                   example: "تم إلغاء الرحلة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     cancellationFee:
 *                       type: number
 *                       example: 0
 *       400:
 *         description: Cannot cancel trip in current status
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put(
  '/:tripId/cancel',
  authenticate,
  authorize('passenger'),
  cancelTripValidator,
  tripController.cancelTrip
);

/**
 * @swagger
 * /trips/{tripId}/rate:
 *   post:
 *     summary: Rate a completed trip
 *     description: Passenger rates the driver after trip completion
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: "سائق ممتاز"
 *               tip:
 *                 type: number
 *                 example: 10
 *     responses:
 *       200:
 *         description: Rating submitted successfully
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
 *                   example: "Rating submitted successfully"
 *                 messageAr:
 *                   type: string
 *                   example: "تم تقديم التقييم بنجاح"
 *       400:
 *         description: Trip not completed or already rated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/:tripId/rate',
  authenticate,
  authorize('passenger'),
  rateTripValidator,
  tripController.rateTrip
);

/**
 * @swagger
 * /trips/{tripId}/share:
 *   post:
 *     summary: Share trip with contacts
 *     description: Generates a shareable link for trip tracking
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contacts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["+201234567890"]
 *     responses:
 *       200:
 *         description: Share link generated
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
 *                     shareLink:
 *                       type: string
 *                       example: "https://wasalni.com/track/abc123"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/:tripId/share',
  authenticate,
  authorize('passenger'),
  shareTripValidator,
  tripController.shareTrip
);

/**
 * @swagger
 * /trips/{tripId}/sos:
 *   post:
 *     summary: Trigger SOS emergency
 *     description: Activates emergency protocol and notifies contacts and support
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "أحتاج مساعدة!"
 *     responses:
 *       200:
 *         description: SOS triggered successfully
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
 *                   example: "SOS alert sent"
 *                 messageAr:
 *                   type: string
 *                   example: "تم إرسال تنبيه الطوارئ"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/:tripId/sos',
  authenticate,
  tripIdValidator,
  tripController.triggerSOS
);

export default router;
