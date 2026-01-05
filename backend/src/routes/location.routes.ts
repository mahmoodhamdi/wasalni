import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import locationController from '../controllers/location.controller';

const router = Router();

/**
 * @swagger
 * /location/search:
 *   get:
 *     summary: Search for places
 *     description: Search for places using Google Places API
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *         example: "ميدان التحرير"
 *     responses:
 *       200:
 *         description: Places found
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
 *                     type: object
 *                     properties:
 *                       placeId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       address:
 *                         type: string
 *                       location:
 *                         $ref: '#/components/schemas/GeoPoint'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/search', authenticate, locationController.searchPlaces);

/**
 * @swagger
 * /location/place/{placeId}:
 *   get:
 *     summary: Get place details
 *     description: Get detailed information about a place by its ID
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Place details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Location'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/place/:placeId', authenticate, locationController.getPlaceDetails);

/**
 * @swagger
 * /location/address:
 *   get:
 *     summary: Get address from coordinates
 *     description: Reverse geocode coordinates to get address
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         example: 30.0444
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         example: 31.2357
 *     responses:
 *       200:
 *         description: Address retrieved
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
 *                     address:
 *                       type: string
 *                       example: "ميدان التحرير، القاهرة"
 *                     placeId:
 *                       type: string
 */
router.get('/address', authenticate, locationController.getAddress);

/**
 * @swagger
 * /location/route:
 *   post:
 *     summary: Calculate route between two points
 *     description: Get route information including distance, duration, and polyline
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *             properties:
 *               origin:
 *                 $ref: '#/components/schemas/GeoPoint'
 *               destination:
 *                 $ref: '#/components/schemas/GeoPoint'
 *     responses:
 *       200:
 *         description: Route calculated
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
 *                     distance:
 *                       type: number
 *                       example: 12.5
 *                     duration:
 *                       type: number
 *                       example: 25
 *                     polyline:
 *                       type: string
 */
router.post('/route', authenticate, locationController.calculateRoute);

/**
 * @swagger
 * /location/fare:
 *   post:
 *     summary: Get fare estimate from location
 *     description: Quick fare estimate based on origin and destination
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *             properties:
 *               origin:
 *                 $ref: '#/components/schemas/GeoPoint'
 *               destination:
 *                 $ref: '#/components/schemas/GeoPoint'
 *     responses:
 *       200:
 *         description: Fare estimate retrieved
 */
router.post('/fare', authenticate, locationController.getFareEstimate);

/**
 * @swagger
 * /location/eta:
 *   get:
 *     summary: Get ETA to destination
 *     description: Get estimated time of arrival
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: originLat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: originLng
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: destLat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: destLng
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: ETA calculated
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
 *                     eta:
 *                       type: number
 *                       description: ETA in minutes
 *                       example: 15
 */
router.get('/eta', authenticate, locationController.getETA);

/**
 * @swagger
 * /location/drivers/nearby:
 *   get:
 *     summary: Get nearby drivers
 *     description: Find available drivers near a location
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         example: 30.0444
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         example: 31.2357
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 5
 *         description: Search radius in km
 *       - in: query
 *         name: rideType
 *         schema:
 *           type: string
 *           enum: [economy, comfort, family, tuktuk, motorcycle]
 *     responses:
 *       200:
 *         description: Nearby drivers found
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
 *                     type: object
 *                     properties:
 *                       driverId:
 *                         type: string
 *                       location:
 *                         $ref: '#/components/schemas/GeoPoint'
 *                       vehicleType:
 *                         type: string
 *                       eta:
 *                         type: number
 */
router.get('/drivers/nearby', authenticate, locationController.getNearbyDrivers);

/**
 * @swagger
 * /location/driver/{driverId}:
 *   get:
 *     summary: Get driver location
 *     description: Get real-time location of a specific driver
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Driver location retrieved
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
 *                     location:
 *                       $ref: '#/components/schemas/GeoPoint'
 *                     heading:
 *                       type: number
 *                     speed:
 *                       type: number
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 */
router.get('/driver/:driverId', authenticate, locationController.getDriverLocation);

/**
 * @swagger
 * /location/update:
 *   post:
 *     summary: Update driver location
 *     description: Driver updates their current location
 *     tags: [Location, Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lng
 *             properties:
 *               lat:
 *                 type: number
 *                 example: 30.0444
 *               lng:
 *                 type: number
 *                 example: 31.2357
 *               heading:
 *                 type: number
 *                 description: Direction in degrees
 *                 example: 90
 *               speed:
 *                 type: number
 *                 description: Speed in km/h
 *                 example: 30
 *     responses:
 *       200:
 *         description: Location updated
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
 *                   example: "Location updated"
 *                 messageAr:
 *                   type: string
 *                   example: "تم تحديث الموقع"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/update', authenticate, requireRole('driver'), locationController.updateLocation);

/**
 * @swagger
 * /location/status:
 *   post:
 *     summary: Set driver online status
 *     description: Driver sets their online/offline status
 *     tags: [Location, Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isOnline
 *             properties:
 *               isOnline:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Status updated
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
 *                   example: "You are now online"
 *                 messageAr:
 *                   type: string
 *                   example: "أنت الآن متصل"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/status', authenticate, requireRole('driver'), locationController.setOnlineStatus);

/**
 * @swagger
 * /location/stats:
 *   get:
 *     summary: Get location statistics
 *     description: Get location-related statistics (Admin only)
 *     tags: [Location, Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved
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
 *                     onlineDrivers:
 *                       type: integer
 *                     activeTrips:
 *                       type: integer
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/stats', authenticate, requireRole('admin'), locationController.getLocationStats);

/**
 * @swagger
 * /location/drivers/online:
 *   get:
 *     summary: Get all online drivers
 *     description: Get list of all online drivers with their locations (Admin only)
 *     tags: [Location, Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Online drivers retrieved
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
 *                     $ref: '#/components/schemas/Driver'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/drivers/online', authenticate, requireRole('admin'), locationController.getAllOnlineDrivers);

export default router;
