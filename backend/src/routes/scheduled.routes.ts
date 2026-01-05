import { Router } from 'express';
import { authenticate, passengerOnly } from '../middleware/auth.middleware';
import scheduledController from '../controllers/scheduled.controller';
import {
  createScheduledTripValidator,
  modifyTripTimeValidator,
  cancelTripValidator,
  getTripDetailsValidator,
  getStatsValidator,
  getAvailableSlotsValidator,
} from '../validators/scheduled.validator';

const router = Router();

// All routes require authentication and passenger role
router.use(authenticate);
router.use(passengerOnly);

/**
 * @swagger
 * tags:
 *   name: Scheduled
 *   description: Scheduled trips management for passengers
 */

/**
 * @swagger
 * /scheduled:
 *   post:
 *     summary: Create a scheduled trip
 *     description: Creates a new scheduled trip for a future time. The scheduled time must be at least 30 minutes in the future and no more than 7 days in advance.
 *     tags: [Scheduled]
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
 *               - scheduledTime
 *             properties:
 *               pickup:
 *                 type: object
 *                 required:
 *                   - address
 *                   - latitude
 *                   - longitude
 *                 properties:
 *                   address:
 *                     type: string
 *                     minLength: 5
 *                     maxLength: 500
 *                     example: "شارع الجمهورية، الباجور"
 *                   latitude:
 *                     type: number
 *                     minimum: -90
 *                     maximum: 90
 *                     example: 30.4285
 *                   longitude:
 *                     type: number
 *                     minimum: -180
 *                     maximum: 180
 *                     example: 30.9785
 *                   name:
 *                     type: string
 *                     maxLength: 200
 *                     example: "المنزل"
 *               dropoff:
 *                 type: object
 *                 required:
 *                   - address
 *                   - latitude
 *                   - longitude
 *                 properties:
 *                   address:
 *                     type: string
 *                     minLength: 5
 *                     maxLength: 500
 *                     example: "محطة قطار الباجور"
 *                   latitude:
 *                     type: number
 *                     minimum: -90
 *                     maximum: 90
 *                     example: 30.4315
 *                   longitude:
 *                     type: number
 *                     minimum: -180
 *                     maximum: 180
 *                     example: 30.9825
 *                   name:
 *                     type: string
 *                     maxLength: 200
 *                     example: "محطة القطار"
 *               stops:
 *                 type: array
 *                 maxItems: 3
 *                 items:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                       example: "صيدلية الشفاء"
 *                     latitude:
 *                       type: number
 *                       example: 30.4295
 *                     longitude:
 *                       type: number
 *                       example: 30.9800
 *               rideType:
 *                 type: string
 *                 enum: [economy, comfort, family, tuktuk, motorcycle]
 *                 example: "economy"
 *               scheduledTime:
 *                 type: string
 *                 format: date-time
 *                 description: Must be at least 30 minutes in the future and no more than 7 days ahead
 *                 example: "2025-01-10T09:00:00.000Z"
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, wallet, card]
 *                 default: "cash"
 *                 example: "cash"
 *               promoCode:
 *                 type: string
 *                 maxLength: 20
 *                 pattern: "^[A-Z0-9]+$"
 *                 example: "WELCOME50"
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 example: "عند البوابة الرئيسية"
 *     responses:
 *       201:
 *         description: Scheduled trip created successfully
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
 *                   example: "Scheduled trip created successfully"
 *                 messageAr:
 *                   type: string
 *                   example: "تم إنشاء الرحلة المجدولة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     trip:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         tripNumber:
 *                           type: string
 *                           example: "TRP-1234567"
 *                         scheduledTime:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-01-10T09:00:00.000Z"
 *                         pickup:
 *                           type: object
 *                           properties:
 *                             address:
 *                               type: string
 *                               example: "شارع الجمهورية، الباجور"
 *                             coordinates:
 *                               type: array
 *                               items:
 *                                 type: number
 *                               example: [30.9785, 30.4285]
 *                         dropoff:
 *                           type: object
 *                           properties:
 *                             address:
 *                               type: string
 *                               example: "محطة قطار الباجور"
 *                             coordinates:
 *                               type: array
 *                               items:
 *                                 type: number
 *                               example: [30.9825, 30.4315]
 *                         estimatedFare:
 *                           type: number
 *                           example: 25.50
 *                         rideType:
 *                           type: string
 *                           example: "economy"
 *                         status:
 *                           type: string
 *                           example: "scheduled"
 *       400:
 *         description: Validation failed or invalid scheduled time
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
 */
router.post('/', createScheduledTripValidator, scheduledController.createScheduledTrip);

/**
 * @swagger
 * /scheduled:
 *   get:
 *     summary: Get upcoming scheduled trips
 *     description: Returns a paginated list of upcoming scheduled trips for the authenticated passenger
 *     tags: [Scheduled]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Upcoming trips retrieved successfully
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
 *                   example: "Upcoming trips retrieved"
 *                 messageAr:
 *                   type: string
 *                   example: "تم استرجاع الرحلات المجدولة"
 *                 data:
 *                   type: object
 *                   properties:
 *                     trips:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ScheduledTrip'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Failed to retrieve scheduled trips
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
 *                   example: "Failed to get scheduled trips"
 *                 messageAr:
 *                   type: string
 *                   example: "فشل في استرجاع الرحلات المجدولة"
 */
router.get('/', scheduledController.getUpcomingTrips);

/**
 * @swagger
 * /scheduled/stats:
 *   get:
 *     summary: Get scheduled trips statistics
 *     description: Returns statistics about scheduled trips for the authenticated passenger within a date range
 *     tags: [Scheduled]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for the statistics period (defaults to 30 days ago)
 *         example: "2024-12-01T00:00:00.000Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for the statistics period (defaults to current date)
 *         example: "2025-01-05T23:59:59.000Z"
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
 *                       type: object
 *                       properties:
 *                         totalScheduled:
 *                           type: integer
 *                           example: 15
 *                         completed:
 *                           type: integer
 *                           example: 10
 *                         cancelled:
 *                           type: integer
 *                           example: 3
 *                         pending:
 *                           type: integer
 *                           example: 2
 *                         totalSpent:
 *                           type: number
 *                           example: 350.75
 *       400:
 *         description: Invalid date format or end date before start date
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
 *                   example: "End date must be after start date"
 *                 messageAr:
 *                   type: string
 *                   example: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Failed to retrieve statistics
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
 *                   example: "فشل في استرجاع الإحصائيات"
 */
router.get('/stats', getStatsValidator, scheduledController.getTripsStats);

/**
 * @swagger
 * /scheduled/slots:
 *   get:
 *     summary: Get available time slots for a date
 *     description: Returns available scheduling time slots for a specific date. Only dates within the next 7 days are allowed.
 *     tags: [Scheduled]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: The date to get available slots for (must be today or within 7 days)
 *         example: "2025-01-06"
 *     responses:
 *       200:
 *         description: Available slots retrieved successfully
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
 *                   example: "Available slots retrieved"
 *                 messageAr:
 *                   type: string
 *                   example: "تم استرجاع المواعيد المتاحة"
 *                 data:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                       example: "2025-01-06"
 *                     slots:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: date-time
 *                       example: ["2025-01-06T06:00:00.000Z", "2025-01-06T06:30:00.000Z", "2025-01-06T07:00:00.000Z"]
 *                     count:
 *                       type: integer
 *                       example: 36
 *       400:
 *         description: Date is required, invalid format, or out of allowed range
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
 *                   example: "Date is required"
 *                 messageAr:
 *                   type: string
 *                   example: "التاريخ مطلوب"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Failed to retrieve available slots
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
 *                   example: "Failed to get available slots"
 *                 messageAr:
 *                   type: string
 *                   example: "فشل في استرجاع المواعيد المتاحة"
 */
router.get('/slots', getAvailableSlotsValidator, scheduledController.getAvailableSlots);

/**
 * @swagger
 * /scheduled/{tripId}:
 *   get:
 *     summary: Get scheduled trip details
 *     description: Returns detailed information about a specific scheduled trip owned by the authenticated passenger
 *     tags: [Scheduled]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: The MongoDB ObjectId of the scheduled trip
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Trip details retrieved successfully
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
 *                   example: "Trip details retrieved"
 *                 messageAr:
 *                   type: string
 *                   example: "تم استرجاع تفاصيل الرحلة"
 *                 data:
 *                   type: object
 *                   properties:
 *                     trip:
 *                       $ref: '#/components/schemas/ScheduledTrip'
 *       400:
 *         description: Invalid trip ID format
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
 *                   example: "Invalid trip ID"
 *                 messageAr:
 *                   type: string
 *                   example: "معرف الرحلة غير صالح"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Scheduled trip not found
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
 *                   example: "Scheduled trip not found"
 *                 messageAr:
 *                   type: string
 *                   example: "لم يتم العثور على الرحلة المجدولة"
 *       500:
 *         description: Failed to retrieve trip details
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
 *                   example: "Failed to get trip details"
 *                 messageAr:
 *                   type: string
 *                   example: "فشل في استرجاع تفاصيل الرحلة"
 */
router.get('/:tripId', getTripDetailsValidator, scheduledController.getTripDetails);

/**
 * @swagger
 * /scheduled/{tripId}/time:
 *   patch:
 *     summary: Modify scheduled trip time
 *     description: Updates the scheduled time for an existing scheduled trip. The new time must be at least 30 minutes in the future and no more than 7 days ahead.
 *     tags: [Scheduled]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: The MongoDB ObjectId of the scheduled trip
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduledTime
 *             properties:
 *               scheduledTime:
 *                 type: string
 *                 format: date-time
 *                 description: The new scheduled time (must be at least 30 minutes in the future and no more than 7 days ahead)
 *                 example: "2025-01-11T10:00:00.000Z"
 *     responses:
 *       200:
 *         description: Trip time modified successfully
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
 *                   example: "Trip time modified successfully"
 *                 messageAr:
 *                   type: string
 *                   example: "تم تعديل موعد الرحلة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     trip:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         tripNumber:
 *                           type: string
 *                           example: "TRP-1234567"
 *                         scheduledTime:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-01-11T10:00:00.000Z"
 *       400:
 *         description: Validation failed, invalid trip ID, or invalid scheduled time
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
 *                   example: "Scheduled time must be at least 30 minutes in the future"
 *                 messageAr:
 *                   type: string
 *                   example: "يجب أن يكون موعد الرحلة بعد 30 دقيقة على الأقل من الآن"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Scheduled trip not found or does not belong to passenger
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
 *                   example: "Scheduled trip not found"
 *                 messageAr:
 *                   type: string
 *                   example: "لم يتم العثور على الرحلة المجدولة"
 */
router.patch('/:tripId/time', modifyTripTimeValidator, scheduledController.modifyTripTime);

/**
 * @swagger
 * /scheduled/{tripId}/cancel:
 *   post:
 *     summary: Cancel scheduled trip
 *     description: Cancels an existing scheduled trip. A cancellation fee may apply depending on how close to the scheduled time the cancellation occurs.
 *     tags: [Scheduled]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: The MongoDB ObjectId of the scheduled trip
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional reason for cancellation
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
 *                     trip:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         tripNumber:
 *                           type: string
 *                           example: "TRP-1234567"
 *                         cancellationFee:
 *                           type: number
 *                           description: The cancellation fee charged (if any)
 *                           example: 5.00
 *       400:
 *         description: Invalid trip ID or trip cannot be cancelled
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
 *                   example: "Trip cannot be cancelled"
 *                 messageAr:
 *                   type: string
 *                   example: "لا يمكن إلغاء الرحلة"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Scheduled trip not found or does not belong to passenger
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
 *                   example: "Scheduled trip not found"
 *                 messageAr:
 *                   type: string
 *                   example: "لم يتم العثور على الرحلة المجدولة"
 */
router.post('/:tripId/cancel', cancelTripValidator, scheduledController.cancelTrip);

/**
 * @swagger
 * components:
 *   schemas:
 *     ScheduledTrip:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         tripNumber:
 *           type: string
 *           example: "TRP-1234567"
 *         passenger:
 *           type: string
 *           description: Reference to the passenger who created the trip
 *           example: "507f1f77bcf86cd799439012"
 *         pickup:
 *           type: object
 *           properties:
 *             address:
 *               type: string
 *               example: "شارع الجمهورية، الباجور"
 *             location:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: "Point"
 *                 coordinates:
 *                   type: array
 *                   items:
 *                     type: number
 *                   example: [30.9785, 30.4285]
 *         dropoff:
 *           type: object
 *           properties:
 *             address:
 *               type: string
 *               example: "محطة قطار الباجور"
 *             location:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: "Point"
 *                 coordinates:
 *                   type: array
 *                   items:
 *                     type: number
 *                   example: [30.9825, 30.4315]
 *         stops:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *         rideType:
 *           type: string
 *           enum: [economy, comfort, family, tuktuk, motorcycle]
 *           example: "economy"
 *         scheduledTime:
 *           type: string
 *           format: date-time
 *           example: "2025-01-10T09:00:00.000Z"
 *         status:
 *           type: string
 *           enum: [scheduled, pending, searching, accepted, arriving, arrived, in_progress, completed, cancelled]
 *           example: "scheduled"
 *         estimatedFare:
 *           type: number
 *           example: 25.50
 *         paymentMethod:
 *           type: string
 *           enum: [cash, wallet, card]
 *           example: "cash"
 *         notes:
 *           type: string
 *           example: "عند البوابة الرئيسية"
 *         cancellationFee:
 *           type: number
 *           example: 0
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-01-05T10:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-01-05T10:00:00.000Z"
 */

export default router;
