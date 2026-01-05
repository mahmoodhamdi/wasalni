import { Router } from 'express';
import safetyController from '../controllers/safety.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  addEmergencyContactValidator,
  updateEmergencyContactValidator,
  removeEmergencyContactValidator,
  updateSafetyPreferencesValidator,
  generateShareLinkValidator,
  getTripForTrackingValidator,
  triggerSOSValidator,
  resolveSOSValidator,
  verifyDriverValidator,
  safetyCheckResponseValidator,
} from '../validators/safety.validator';

const router = Router();

// ============================================
// Emergency Contacts Routes
// ============================================

/**
 * @swagger
 * /safety/emergency-contacts:
 *   get:
 *     summary: Get emergency contacts
 *     description: Returns all emergency contacts for the authenticated passenger
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Emergency contacts retrieved successfully
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
 *                   example: "Emergency contacts retrieved"
 *                 messageAr:
 *                   type: string
 *                   example: "تم جلب جهات الاتصال الطارئة"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EmergencyContact'
 *       400:
 *         description: Passenger ID not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/emergency-contacts',
  authenticate,
  authorize('passenger'),
  safetyController.getEmergencyContacts
);

/**
 * @swagger
 * /safety/emergency-contacts:
 *   post:
 *     summary: Add emergency contact
 *     description: Add a new emergency contact for the authenticated passenger. Maximum 5 contacts allowed.
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - relationship
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "أحمد محمد"
 *                 description: Contact name (2-50 characters)
 *               phone:
 *                 type: string
 *                 example: "+201234567890"
 *                 description: Egyptian phone number
 *               relationship:
 *                 type: string
 *                 enum: [parent, spouse, sibling, friend, other]
 *                 example: "sibling"
 *                 description: Relationship to the passenger
 *               notifyOnTrip:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to notify this contact when a trip starts
 *               notifyOnSOS:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to notify this contact on SOS trigger
 *     responses:
 *       201:
 *         description: Emergency contact added successfully
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
 *                   example: "Emergency contact added"
 *                 messageAr:
 *                   type: string
 *                   example: "تمت إضافة جهة الاتصال الطارئة"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EmergencyContact'
 *       400:
 *         description: Validation failed, maximum contacts reached, or duplicate contact
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/emergency-contacts',
  authenticate,
  authorize('passenger'),
  addEmergencyContactValidator,
  safetyController.addEmergencyContact
);

/**
 * @swagger
 * /safety/emergency-contacts/{contactId}:
 *   put:
 *     summary: Update emergency contact
 *     description: Update an existing emergency contact for the authenticated passenger
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the emergency contact
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "أحمد محمد"
 *                 description: Contact name (2-50 characters)
 *               phone:
 *                 type: string
 *                 example: "+201234567890"
 *                 description: Egyptian phone number
 *               relationship:
 *                 type: string
 *                 enum: [parent, spouse, sibling, friend, other]
 *                 example: "parent"
 *                 description: Relationship to the passenger
 *               notifyOnTrip:
 *                 type: boolean
 *                 description: Whether to notify this contact when a trip starts
 *               notifyOnSOS:
 *                 type: boolean
 *                 description: Whether to notify this contact on SOS trigger
 *     responses:
 *       200:
 *         description: Emergency contact updated successfully
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
 *                   example: "Emergency contact updated"
 *                 messageAr:
 *                   type: string
 *                   example: "تم تحديث جهة الاتصال"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EmergencyContact'
 *       400:
 *         description: Validation failed or invalid contact ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/emergency-contacts/:contactId',
  authenticate,
  authorize('passenger'),
  updateEmergencyContactValidator,
  safetyController.updateEmergencyContact
);

/**
 * @swagger
 * /safety/emergency-contacts/{contactId}:
 *   delete:
 *     summary: Remove emergency contact
 *     description: Remove an emergency contact for the authenticated passenger
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the emergency contact
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Emergency contact removed successfully
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
 *                   example: "Emergency contact removed"
 *                 messageAr:
 *                   type: string
 *                   example: "تم حذف جهة الاتصال"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EmergencyContact'
 *       400:
 *         description: Invalid contact ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/emergency-contacts/:contactId',
  authenticate,
  authorize('passenger'),
  removeEmergencyContactValidator,
  safetyController.removeEmergencyContact
);

// ============================================
// Safety Preferences Routes
// ============================================

/**
 * @swagger
 * /safety/preferences:
 *   get:
 *     summary: Get safety preferences
 *     description: Returns safety preferences for the authenticated passenger
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Safety preferences retrieved successfully
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
 *                   example: "Safety preferences retrieved"
 *                 messageAr:
 *                   type: string
 *                   example: "تم جلب إعدادات الأمان"
 *                 data:
 *                   $ref: '#/components/schemas/SafetyPreferences'
 *       400:
 *         description: Passenger ID not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/preferences',
  authenticate,
  authorize('passenger'),
  safetyController.getSafetyPreferences
);

/**
 * @swagger
 * /safety/preferences:
 *   put:
 *     summary: Update safety preferences
 *     description: Update safety preferences for the authenticated passenger
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               autoShareTrips:
 *                 type: boolean
 *                 description: Automatically share trip details with emergency contacts
 *               shareWithContacts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of contact IDs to share trips with
 *                 example: ["507f1f77bcf86cd799439011"]
 *               sendETAUpdates:
 *                 type: boolean
 *                 description: Send ETA updates to emergency contacts during trips
 *               sosGestureEnabled:
 *                 type: boolean
 *                 description: Enable SOS gesture trigger (e.g., shake phone)
 *               nightModeAlerts:
 *                 type: boolean
 *                 description: Enable additional safety alerts during night hours
 *               recordTrips:
 *                 type: boolean
 *                 description: Record trip audio/video for safety purposes
 *     responses:
 *       200:
 *         description: Safety preferences updated successfully
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
 *                   example: "Safety preferences updated"
 *                 messageAr:
 *                   type: string
 *                   example: "تم تحديث إعدادات الأمان"
 *                 data:
 *                   $ref: '#/components/schemas/SafetyPreferences'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/preferences',
  authenticate,
  authorize('passenger'),
  updateSafetyPreferencesValidator,
  safetyController.updateSafetyPreferences
);

// ============================================
// Trip Sharing Routes
// ============================================

/**
 * @swagger
 * /safety/trips/{tripId}/share:
 *   post:
 *     summary: Generate trip share link
 *     description: Generate a shareable link for trip tracking. Link can be shared with anyone to track the trip in real-time.
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the trip
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expirationHours:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 168
 *                 default: 24
 *                 description: Number of hours the link remains valid (1-168 hours)
 *                 example: 24
 *     responses:
 *       200:
 *         description: Share link generated successfully
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
 *                   example: "Share link generated"
 *                 messageAr:
 *                   type: string
 *                   example: "تم إنشاء رابط المشاركة"
 *                 data:
 *                   type: object
 *                   properties:
 *                     shareUrl:
 *                       type: string
 *                       example: "https://wasalni.com/track/507f1f77bcf86cd799439011?token=abc123xyz"
 *                     token:
 *                       type: string
 *                       example: "abc123xyz"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid trip ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/trips/:tripId/share',
  authenticate,
  authorize('passenger'),
  generateShareLinkValidator,
  safetyController.generateTripShareLink
);

/**
 * @swagger
 * /safety/track/{tripId}:
 *   get:
 *     summary: Get trip for public tracking
 *     description: Get trip details for public tracking using a share token. This endpoint is public and does not require authentication.
 *     tags: [Safety]
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the trip
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Share token obtained from the share link
 *         example: "abc123xyz"
 *     responses:
 *       200:
 *         description: Trip data retrieved successfully
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
 *                   example: "Trip data retrieved"
 *                 messageAr:
 *                   type: string
 *                   example: "تم جلب بيانات الرحلة"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tripId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, searching, driver_assigned, driver_arriving, driver_arrived, trip_started, completed, cancelled]
 *                     pickup:
 *                       $ref: '#/components/schemas/Location'
 *                     dropoff:
 *                       $ref: '#/components/schemas/Location'
 *                     driverLocation:
 *                       $ref: '#/components/schemas/GeoPoint'
 *                     driverName:
 *                       type: string
 *                     vehicleInfo:
 *                       type: string
 *                     estimatedArrival:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Token is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid or expired token
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
 *                   example: "Invalid or expired token"
 *                 messageAr:
 *                   type: string
 *                   example: "رابط غير صالح أو منتهي الصلاحية"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/track/:tripId',
  getTripForTrackingValidator,
  safetyController.getTripForTracking
);

// ============================================
// SOS Routes
// ============================================

/**
 * @swagger
 * /safety/trips/{tripId}/sos:
 *   post:
 *     summary: Trigger SOS for trip
 *     description: Trigger an SOS emergency alert for the trip. Notifies emergency contacts, nearby authorities, and platform admins.
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the trip
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 example: 30.0444
 *                 description: Current latitude of the user
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 example: 31.2357
 *                 description: Current longitude of the user
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
 *                   example: "SOS triggered - help is on the way"
 *                 messageAr:
 *                   type: string
 *                   example: "تم تفعيل الطوارئ - المساعدة في الطريق"
 *                 data:
 *                   type: object
 *                   properties:
 *                     sosId:
 *                       type: string
 *                     tripId:
 *                       type: string
 *                     triggeredAt:
 *                       type: string
 *                       format: date-time
 *                     triggeredBy:
 *                       type: string
 *                       enum: [passenger, driver]
 *                     location:
 *                       $ref: '#/components/schemas/GeoPoint'
 *                     status:
 *                       type: string
 *                       enum: [active, resolved]
 *       400:
 *         description: Invalid trip ID or coordinates
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/trips/:tripId/sos',
  authenticate,
  authorize('passenger', 'driver'),
  triggerSOSValidator,
  safetyController.triggerSOS
);

/**
 * @swagger
 * /safety/trips/{tripId}/sos/resolve:
 *   post:
 *     summary: Resolve SOS event
 *     description: Mark an SOS event as resolved. Admin only endpoint.
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the trip
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Resolution notes (max 500 characters)
 *                 example: "Situation resolved. Passenger confirmed safe."
 *     responses:
 *       200:
 *         description: SOS resolved successfully
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
 *                   example: "SOS resolved"
 *                 messageAr:
 *                   type: string
 *                   example: "تم حل حالة الطوارئ"
 *                 data:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: Invalid trip ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Admin access required
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
 *                   example: "Admin access required"
 *                 messageAr:
 *                   type: string
 *                   example: "يتطلب صلاحيات المسؤول"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/trips/:tripId/sos/resolve',
  authenticate,
  authorize('admin'),
  resolveSOSValidator,
  safetyController.resolveSOS
);

// ============================================
// Safety Check Routes
// ============================================

/**
 * @swagger
 * /safety/trips/{tripId}/safety-check:
 *   post:
 *     summary: Respond to safety check
 *     description: Respond to a periodic safety check during a trip. The system may prompt passengers to confirm they are safe during long or late-night trips.
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the trip
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - response
 *             properties:
 *               response:
 *                 type: string
 *                 enum: [safe, need_help]
 *                 description: Safety check response
 *                 example: "safe"
 *     responses:
 *       200:
 *         description: Response recorded successfully
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
 *                   example: "Response recorded"
 *                 messageAr:
 *                   type: string
 *                   example: "تم تسجيل الاستجابة"
 *                 data:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: Invalid response value or trip ID
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
 *                   example: "Invalid response"
 *                 messageAr:
 *                   type: string
 *                   example: "استجابة غير صالحة"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/trips/:tripId/safety-check',
  authenticate,
  authorize('passenger'),
  safetyCheckResponseValidator,
  safetyController.respondToSafetyCheck
);

// ============================================
// Driver Verification Routes
// ============================================

/**
 * @swagger
 * /safety/verify-driver/{driverId}:
 *   get:
 *     summary: Verify driver for trip
 *     description: Get driver verification information before starting a trip. Returns driver details, vehicle information, and verification status.
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the driver
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Driver verification data retrieved successfully
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
 *                   example: "Driver verification complete"
 *                 messageAr:
 *                   type: string
 *                   example: "تم التحقق من السائق"
 *                 data:
 *                   type: object
 *                   properties:
 *                     driverId:
 *                       type: string
 *                     name:
 *                       type: string
 *                       example: "محمد أحمد"
 *                     photo:
 *                       type: string
 *                       example: "https://..."
 *                     rating:
 *                       type: number
 *                       example: 4.8
 *                     totalTrips:
 *                       type: integer
 *                       example: 150
 *                     memberSince:
 *                       type: string
 *                       format: date-time
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     vehicle:
 *                       type: object
 *                       properties:
 *                         make:
 *                           type: string
 *                           example: "Toyota"
 *                         model:
 *                           type: string
 *                           example: "Corolla"
 *                         color:
 *                           type: string
 *                           example: "أبيض"
 *                         plateNumber:
 *                           type: string
 *                           example: "أ ب ج 1234"
 *                         year:
 *                           type: integer
 *                           example: 2020
 *       400:
 *         description: Invalid driver ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/verify-driver/:driverId',
  authenticate,
  authorize('passenger'),
  verifyDriverValidator,
  safetyController.verifyDriver
);

// ============================================
// Safety Tips Routes
// ============================================

/**
 * @swagger
 * /safety/tips:
 *   get:
 *     summary: Get safety tips
 *     description: Get contextual safety tips for passengers. Tips are customized based on time of day, driver experience, and trip duration.
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isNewDriver
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Whether the assigned driver is new (less than 30 trips)
 *       - in: query
 *         name: isLongTrip
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Whether this is a long trip (over 30 minutes)
 *     responses:
 *       200:
 *         description: Safety tips retrieved successfully
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
 *                   example: "Safety tips retrieved"
 *                 messageAr:
 *                   type: string
 *                   example: "تم جلب نصائح الأمان"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "tip_1"
 *                       title:
 *                         type: string
 *                         example: "Share your trip"
 *                       titleAr:
 *                         type: string
 *                         example: "شارك رحلتك"
 *                       description:
 *                         type: string
 *                         example: "Share your trip details with a trusted contact"
 *                       descriptionAr:
 *                         type: string
 *                         example: "شارك تفاصيل رحلتك مع شخص تثق به"
 *                       icon:
 *                         type: string
 *                         example: "share"
 *                       priority:
 *                         type: string
 *                         enum: [high, medium, low]
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/tips',
  authenticate,
  authorize('passenger'),
  safetyController.getSafetyTips
);

export default router;
