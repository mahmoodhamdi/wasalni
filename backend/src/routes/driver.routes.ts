import { Router } from 'express';
import tripController from '../controllers/trip.controller';
import driverController from '../controllers/driver.controller';
import {
  tripListValidator,
  driverTripActionValidator,
  rateTripValidator,
  cancelTripValidator,
} from '../validators/trip.validator';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { documentUpload, driverDocumentFields } from '../middleware/upload.middleware';

const router = Router();

// ==================== Driver Status Routes ====================

/**
 * @swagger
 * /driver/status:
 *   get:
 *     summary: Get driver status
 *     description: Returns the driver's current status including approval, online status, earnings, and capabilities
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver status retrieved successfully
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
 *                   example: Driver status retrieved successfully
 *                 messageAr:
 *                   type: string
 *                   example: تم استرجاع حالة السائق بنجاح
 *                 data:
 *                   type: object
 *                   properties:
 *                     approvalStatus:
 *                       type: string
 *                       enum: [pending, approved, rejected, suspended]
 *                       example: approved
 *                     onlineStatus:
 *                       type: string
 *                       enum: [offline, online, busy]
 *                       example: online
 *                     totalEarnings:
 *                       type: number
 *                       example: 5000
 *                     totalTrips:
 *                       type: number
 *                       example: 150
 *                     rating:
 *                       type: number
 *                       example: 4.8
 *                     documentsVerified:
 *                       type: boolean
 *                       example: true
 *                     vehicleType:
 *                       type: string
 *                       example: economy
 *                     isApproved:
 *                       type: boolean
 *                       example: true
 *                     canGoOnline:
 *                       type: boolean
 *                       example: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Driver profile not found
 */
router.get(
  '/status',
  authenticate,
  authorize('driver'),
  driverController.getDriverStatus
);

// ==================== Driver Document Routes ====================

/**
 * @swagger
 * /driver/documents/batch:
 *   post:
 *     summary: Upload driver documents (batch)
 *     description: Upload multiple driver documents at once
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nationalIdFront:
 *                 type: string
 *                 format: binary
 *               nationalIdBack:
 *                 type: string
 *                 format: binary
 *               driverLicense:
 *                 type: string
 *                 format: binary
 *               vehicleLicense:
 *                 type: string
 *                 format: binary
 *               vehiclePhoto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 *       400:
 *         description: No files uploaded
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/documents/batch',
  authenticate,
  authorize('driver'),
  documentUpload.fields(driverDocumentFields),
  driverController.uploadDocuments
);

/**
 * @swagger
 * /driver/documents:
 *   get:
 *     summary: Get driver documents status
 *     description: Get the current status of uploaded driver documents
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/documents',
  authenticate,
  authorize('driver'),
  driverController.getDocuments
);

// ==================== Driver Trip Routes ====================

/**
 * @swagger
 * /driver/trips:
 *   get:
 *     summary: Get driver trips history
 *     description: Returns paginated list of trips for the authenticated driver
 *     tags: [Driver]
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
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, cancelled, all]
 *     responses:
 *       200:
 *         description: Driver trips retrieved successfully
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
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/trips',
  authenticate,
  authorize('driver'),
  tripListValidator,
  tripController.getDriverTrips
);

/**
 * @swagger
 * /driver/trips/active:
 *   get:
 *     summary: Get active trip for driver
 *     description: Returns the current active trip for the authenticated driver
 *     tags: [Driver]
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
  '/trips/active',
  authenticate,
  authorize('driver'),
  tripController.getDriverActiveTrip
);

/**
 * @swagger
 * /driver/trips/available:
 *   get:
 *     summary: Get available trip requests
 *     description: Returns pending trip requests near the driver's location
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available trips retrieved
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/trips/available',
  authenticate,
  authorize('driver'),
  tripController.getAvailableTrips
);

/**
 * @swagger
 * /driver/trips/{tripId}/accept:
 *   put:
 *     summary: Accept trip request
 *     description: Driver accepts a pending trip request
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip accepted successfully
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
 *                   example: "Trip accepted"
 *                 messageAr:
 *                   type: string
 *                   example: "تم قبول الرحلة"
 *                 data:
 *                   $ref: '#/components/schemas/Trip'
 *       400:
 *         description: Trip already accepted or not available
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put(
  '/trips/:tripId/accept',
  authenticate,
  authorize('driver'),
  driverTripActionValidator,
  tripController.acceptTrip
);

/**
 * @swagger
 * /driver/trips/{tripId}/reject:
 *   put:
 *     summary: Reject trip request
 *     description: Driver rejects a trip request
 *     tags: [Driver]
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
 *                 example: "مشغول"
 *     responses:
 *       200:
 *         description: Trip rejected
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
 *                   example: "Trip rejected"
 *                 messageAr:
 *                   type: string
 *                   example: "تم رفض الرحلة"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put(
  '/trips/:tripId/reject',
  authenticate,
  authorize('driver'),
  driverTripActionValidator,
  tripController.rejectTrip
);

/**
 * @swagger
 * /driver/trips/{tripId}/status:
 *   put:
 *     summary: Update trip status
 *     description: Driver updates the trip status (arriving, arrived, started)
 *     tags: [Driver]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [driver_arriving, driver_arrived, trip_started]
 *                 example: "driver_arrived"
 *     responses:
 *       200:
 *         description: Status updated successfully
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
 *                   example: "Status updated"
 *                 messageAr:
 *                   type: string
 *                   example: "تم تحديث الحالة"
 *                 data:
 *                   $ref: '#/components/schemas/Trip'
 *       400:
 *         description: Invalid status transition
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put(
  '/trips/:tripId/status',
  authenticate,
  authorize('driver'),
  driverTripActionValidator,
  [
    body('status')
      .notEmpty()
      .isIn(['driver_arriving', 'driver_arrived', 'trip_started'])
      .withMessage('Invalid status'),
  ],
  tripController.updateTripStatus
);

/**
 * @swagger
 * /driver/trips/{tripId}/complete:
 *   put:
 *     summary: Complete trip
 *     description: Driver marks the trip as completed at destination
 *     tags: [Driver]
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
 *               actualDistance:
 *                 type: number
 *                 description: Actual distance traveled in km
 *                 example: 12.5
 *               actualDuration:
 *                 type: number
 *                 description: Actual duration in minutes
 *                 example: 25
 *     responses:
 *       200:
 *         description: Trip completed successfully
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
 *                   example: "Trip completed"
 *                 messageAr:
 *                   type: string
 *                   example: "تم إكمال الرحلة"
 *                 data:
 *                   type: object
 *                   properties:
 *                     trip:
 *                       $ref: '#/components/schemas/Trip'
 *                     earnings:
 *                       type: number
 *                       example: 44
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put(
  '/trips/:tripId/complete',
  authenticate,
  authorize('driver'),
  driverTripActionValidator,
  [
    body('actualDistance').optional().isFloat({ min: 0 }),
    body('actualDuration').optional().isFloat({ min: 0 }),
  ],
  tripController.completeTrip
);

/**
 * @swagger
 * /driver/trips/{tripId}/cancel:
 *   put:
 *     summary: Cancel trip (driver)
 *     description: Driver cancels an accepted trip
 *     tags: [Driver]
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "طوارئ شخصية"
 *     responses:
 *       200:
 *         description: Trip cancelled
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
 *                   example: "Trip cancelled"
 *                 messageAr:
 *                   type: string
 *                   example: "تم إلغاء الرحلة"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put(
  '/trips/:tripId/cancel',
  authenticate,
  authorize('driver'),
  cancelTripValidator,
  tripController.driverCancelTrip
);

/**
 * @swagger
 * /driver/trips/{tripId}/rate:
 *   post:
 *     summary: Rate passenger
 *     description: Driver rates the passenger after trip completion
 *     tags: [Driver]
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
 *                 example: "راكب محترم"
 *     responses:
 *       200:
 *         description: Rating submitted
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
 *                   example: "Rating submitted"
 *                 messageAr:
 *                   type: string
 *                   example: "تم تقديم التقييم"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/trips/:tripId/rate',
  authenticate,
  authorize('driver'),
  rateTripValidator,
  tripController.ratePassenger
);

export default router;
