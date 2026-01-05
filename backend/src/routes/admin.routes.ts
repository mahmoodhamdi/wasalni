import { Router } from 'express';
import { authenticate, adminOnly } from '../middleware/auth.middleware';
import adminController from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(adminOnly);

// ==================== Dashboard ====================

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Returns overall statistics for the admin dashboard including total counts for trips, passengers, drivers, and revenue metrics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
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
 *                   example: Dashboard stats retrieved
 *                 messageAr:
 *                   type: string
 *                   example: تم استرجاع إحصائيات لوحة التحكم
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalTrips:
 *                           type: integer
 *                           example: 1500
 *                         totalPassengers:
 *                           type: integer
 *                           example: 500
 *                         totalDrivers:
 *                           type: integer
 *                           example: 100
 *                         totalRevenue:
 *                           type: number
 *                           example: 75000
 *                         activeDrivers:
 *                           type: integer
 *                           example: 45
 *                         pendingDrivers:
 *                           type: integer
 *                           example: 12
 *                         tripsToday:
 *                           type: integer
 *                           example: 85
 *                         revenueToday:
 *                           type: number
 *                           example: 4250
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Internal server error
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
 *                   example: Failed to get dashboard stats
 *                 messageAr:
 *                   type: string
 *                   example: فشل استرجاع الإحصائيات
 */
router.get('/stats', adminController.getDashboardStats);

// ==================== Passengers ====================

/**
 * @swagger
 * /admin/passengers:
 *   get:
 *     summary: Get all passengers with pagination
 *     description: Retrieves a paginated list of all passengers with optional filtering and sorting
 *     tags: [Admin]
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
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or phone number
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, totalTrips, rating]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Passengers retrieved successfully
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
 *                   example: Passengers retrieved
 *                 messageAr:
 *                   type: string
 *                   example: تم استرجاع الركاب
 *                 data:
 *                   type: object
 *                   properties:
 *                     passengers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Passenger'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Internal server error
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
 *                   example: Failed to get passengers
 *                 messageAr:
 *                   type: string
 *                   example: فشل استرجاع الركاب
 */
router.get('/passengers', adminController.getPassengers);

/**
 * @swagger
 * /admin/passengers/{passengerId}:
 *   get:
 *     summary: Get passenger by ID
 *     description: Retrieves detailed information about a specific passenger including their trip history and saved places
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: passengerId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the passenger
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Passenger retrieved successfully
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
 *                   example: Passenger retrieved
 *                 messageAr:
 *                   type: string
 *                   example: تم استرجاع بيانات الراكب
 *                 data:
 *                   type: object
 *                   properties:
 *                     passenger:
 *                       $ref: '#/components/schemas/Passenger'
 *       400:
 *         description: Invalid passenger ID format
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
 *                   example: Invalid passenger ID
 *                 messageAr:
 *                   type: string
 *                   example: معرف الراكب غير صالح
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Passenger not found
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
 *                   example: Passenger not found
 *                 messageAr:
 *                   type: string
 *                   example: لم يتم العثور على الراكب
 */
router.get('/passengers/:passengerId', adminController.getPassengerById);

/**
 * @swagger
 * /admin/passengers/{passengerId}:
 *   put:
 *     summary: Update passenger
 *     description: Updates passenger information by admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: passengerId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the passenger
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: أحمد محمد علي
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ahmed@example.com
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Passenger updated successfully
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
 *                   example: Passenger updated
 *                 messageAr:
 *                   type: string
 *                   example: تم تحديث بيانات الراكب
 *                 data:
 *                   type: object
 *                   properties:
 *                     passenger:
 *                       $ref: '#/components/schemas/Passenger'
 *       400:
 *         description: Invalid passenger ID format
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
 *                   example: Invalid passenger ID
 *                 messageAr:
 *                   type: string
 *                   example: معرف الراكب غير صالح
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Passenger not found
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
 *                   example: Passenger not found
 *                 messageAr:
 *                   type: string
 *                   example: لم يتم العثور على الراكب
 */
router.put('/passengers/:passengerId', adminController.updatePassenger);

/**
 * @swagger
 * /admin/passengers/{passengerId}/toggle-active:
 *   put:
 *     summary: Toggle passenger active status
 *     description: Activates or deactivates a passenger account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: passengerId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the passenger
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Passenger status toggled successfully
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
 *                   example: Passenger activated
 *                 messageAr:
 *                   type: string
 *                   example: تم تفعيل الراكب
 *                 data:
 *                   type: object
 *                   properties:
 *                     passenger:
 *                       $ref: '#/components/schemas/Passenger'
 *       400:
 *         description: Invalid passenger ID or operation failed
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
 *                   example: Invalid passenger ID
 *                 messageAr:
 *                   type: string
 *                   example: معرف الراكب غير صالح
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/passengers/:passengerId/toggle-active', adminController.togglePassengerActive);

// ==================== Drivers ====================

/**
 * @swagger
 * /admin/drivers:
 *   get:
 *     summary: Get all drivers with pagination
 *     description: Retrieves a paginated list of all drivers with optional filtering by status, vehicle type, and online status
 *     tags: [Admin]
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
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, phone, or plate number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, suspended]
 *         description: Filter by approval status
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *           enum: [economy, comfort, family, tuktuk, motorcycle]
 *         description: Filter by vehicle type
 *       - in: query
 *         name: isOnline
 *         schema:
 *           type: boolean
 *         description: Filter by online status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, totalTrips, rating, totalEarnings]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Drivers retrieved successfully
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
 *                   example: Drivers retrieved
 *                 messageAr:
 *                   type: string
 *                   example: تم استرجاع السائقين
 *                 data:
 *                   type: object
 *                   properties:
 *                     drivers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Driver'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Internal server error
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
 *                   example: Failed to get drivers
 *                 messageAr:
 *                   type: string
 *                   example: فشل استرجاع السائقين
 */
router.get('/drivers', adminController.getDrivers);

/**
 * @swagger
 * /admin/drivers/pending:
 *   get:
 *     summary: Get pending driver approvals
 *     description: Retrieves a list of drivers awaiting approval
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending drivers retrieved successfully
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
 *                   example: Pending drivers retrieved
 *                 messageAr:
 *                   type: string
 *                   example: تم استرجاع السائقين المنتظرين
 *                 data:
 *                   type: object
 *                   properties:
 *                     drivers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Driver'
 *                     count:
 *                       type: integer
 *                       example: 12
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Internal server error
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
 *                   example: Failed to get pending drivers
 *                 messageAr:
 *                   type: string
 *                   example: فشل استرجاع السائقين المنتظرين
 */
router.get('/drivers/pending', adminController.getPendingDrivers);

/**
 * @swagger
 * /admin/drivers/recent:
 *   get:
 *     summary: Get recent drivers
 *     description: Retrieves recently registered drivers (alias for pending endpoint)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent drivers retrieved successfully
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
 *                   example: Pending drivers retrieved
 *                 messageAr:
 *                   type: string
 *                   example: تم استرجاع السائقين المنتظرين
 *                 data:
 *                   type: object
 *                   properties:
 *                     drivers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Driver'
 *                     count:
 *                       type: integer
 *                       example: 12
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/drivers/recent', adminController.getPendingDrivers);

/**
 * @swagger
 * /admin/drivers/{driverId}:
 *   get:
 *     summary: Get driver by ID
 *     description: Retrieves detailed information about a specific driver including their documents, vehicle, and performance metrics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the driver
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Driver retrieved successfully
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
 *                   example: Driver retrieved
 *                 messageAr:
 *                   type: string
 *                   example: تم استرجاع بيانات السائق
 *                 data:
 *                   type: object
 *                   properties:
 *                     driver:
 *                       $ref: '#/components/schemas/Driver'
 *       400:
 *         description: Invalid driver ID format
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
 *                   example: Invalid driver ID
 *                 messageAr:
 *                   type: string
 *                   example: معرف السائق غير صالح
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Driver not found
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
 *                   example: Driver not found
 *                 messageAr:
 *                   type: string
 *                   example: لم يتم العثور على السائق
 */
router.get('/drivers/:driverId', adminController.getDriverById);

/**
 * @swagger
 * /admin/drivers/{driverId}/approve:
 *   put:
 *     summary: Approve driver
 *     description: Approves a pending driver application, allowing them to start accepting trips
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the driver
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Driver approved successfully
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
 *                   example: Driver approved
 *                 messageAr:
 *                   type: string
 *                   example: تمت الموافقة على السائق
 *                 data:
 *                   type: object
 *                   properties:
 *                     driver:
 *                       $ref: '#/components/schemas/Driver'
 *       400:
 *         description: Invalid driver ID or driver cannot be approved
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
 *                   example: Admin ID required
 *                 messageAr:
 *                   type: string
 *                   example: معرف المسؤول مطلوب
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/drivers/:driverId/approve', adminController.approveDriver);

/**
 * @swagger
 * /admin/drivers/{driverId}/reject:
 *   put:
 *     summary: Reject driver
 *     description: Rejects a pending driver application with a reason
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the driver
 *         example: 507f1f77bcf86cd799439011
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
 *                 description: Reason for rejection
 *                 example: المستندات غير مكتملة أو غير واضحة
 *     responses:
 *       200:
 *         description: Driver rejected successfully
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
 *                   example: Driver rejected
 *                 messageAr:
 *                   type: string
 *                   example: تم رفض السائق
 *                 data:
 *                   type: object
 *                   properties:
 *                     driver:
 *                       $ref: '#/components/schemas/Driver'
 *       400:
 *         description: Invalid request - missing reason or invalid driver ID
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
 *                   example: Rejection reason required
 *                 messageAr:
 *                   type: string
 *                   example: سبب الرفض مطلوب
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/drivers/:driverId/reject', adminController.rejectDriver);

/**
 * @swagger
 * /admin/drivers/{driverId}/suspend:
 *   put:
 *     summary: Suspend driver
 *     description: Suspends an approved driver with a reason, preventing them from accepting new trips
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the driver
 *         example: 507f1f77bcf86cd799439011
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
 *                 description: Reason for suspension
 *                 example: شكاوى متعددة من الركاب
 *     responses:
 *       200:
 *         description: Driver suspended successfully
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
 *                   example: Driver suspended
 *                 messageAr:
 *                   type: string
 *                   example: تم إيقاف السائق
 *                 data:
 *                   type: object
 *                   properties:
 *                     driver:
 *                       $ref: '#/components/schemas/Driver'
 *       400:
 *         description: Invalid request - missing reason or invalid driver ID
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
 *                   example: Suspension reason required
 *                 messageAr:
 *                   type: string
 *                   example: سبب الإيقاف مطلوب
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/drivers/:driverId/suspend', adminController.suspendDriver);

/**
 * @swagger
 * /admin/drivers/{driverId}/activate:
 *   put:
 *     summary: Activate suspended driver
 *     description: Reactivates a suspended driver, allowing them to accept trips again
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the driver
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Driver activated successfully
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
 *                   example: Driver activated
 *                 messageAr:
 *                   type: string
 *                   example: تم تفعيل السائق
 *                 data:
 *                   type: object
 *                   properties:
 *                     driver:
 *                       $ref: '#/components/schemas/Driver'
 *       400:
 *         description: Invalid driver ID or driver cannot be activated
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
 *                   example: Invalid driver ID
 *                 messageAr:
 *                   type: string
 *                   example: معرف السائق غير صالح
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/drivers/:driverId/activate', adminController.activateDriver);

// ==================== Trips ====================

/**
 * @swagger
 * /admin/trips:
 *   get:
 *     summary: Get all trips with pagination
 *     description: Retrieves a paginated list of all trips with optional filtering by status, date range, passenger, and driver
 *     tags: [Admin]
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
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, searching, driver_assigned, driver_arriving, driver_arrived, trip_started, completed, cancelled]
 *         description: Filter by trip status
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for date range filter (ISO 8601 format)
 *         example: "2024-01-01T00:00:00Z"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for date range filter (ISO 8601 format)
 *         example: "2024-12-31T23:59:59Z"
 *       - in: query
 *         name: passengerId
 *         schema:
 *           type: string
 *         description: Filter by passenger ID
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *         description: Filter by driver ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, fare, distance, duration]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
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
 *                 message:
 *                   type: string
 *                   example: Trips retrieved
 *                 messageAr:
 *                   type: string
 *                   example: تم استرجاع الرحلات
 *                 data:
 *                   type: object
 *                   properties:
 *                     trips:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Trip'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Internal server error
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
 *                   example: Failed to get trips
 *                 messageAr:
 *                   type: string
 *                   example: فشل استرجاع الرحلات
 */
router.get('/trips', adminController.getTrips);

/**
 * @swagger
 * /admin/trips/recent:
 *   get:
 *     summary: Get recent trips
 *     description: Retrieves the most recent trips for quick dashboard view
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Number of recent trips to retrieve
 *     responses:
 *       200:
 *         description: Recent trips retrieved successfully
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
 *                   example: Recent trips retrieved
 *                 messageAr:
 *                   type: string
 *                   example: تم استرجاع آخر الرحلات
 *                 data:
 *                   type: object
 *                   properties:
 *                     trips:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Trip'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Internal server error
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
 *                   example: Failed to get recent trips
 *                 messageAr:
 *                   type: string
 *                   example: فشل استرجاع آخر الرحلات
 */
router.get('/trips/recent', adminController.getRecentTrips);

/**
 * @swagger
 * /admin/trips/stats:
 *   get:
 *     summary: Get trip statistics
 *     description: Retrieves aggregate trip statistics optionally filtered by date range
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for statistics (ISO 8601 format)
 *         example: "2024-01-01T00:00:00Z"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for statistics (ISO 8601 format)
 *         example: "2024-12-31T23:59:59Z"
 *     responses:
 *       200:
 *         description: Trip statistics retrieved successfully
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
 *                   example: Trip stats retrieved
 *                 messageAr:
 *                   type: string
 *                   example: تم استرجاع إحصائيات الرحلات
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalTrips:
 *                           type: integer
 *                           example: 1500
 *                         completedTrips:
 *                           type: integer
 *                           example: 1350
 *                         cancelledTrips:
 *                           type: integer
 *                           example: 150
 *                         averageFare:
 *                           type: number
 *                           example: 45.50
 *                         totalRevenue:
 *                           type: number
 *                           example: 61425
 *                         averageDistance:
 *                           type: number
 *                           example: 8.5
 *                         averageDuration:
 *                           type: number
 *                           example: 22
 *                         tripsByStatus:
 *                           type: object
 *                           additionalProperties:
 *                             type: integer
 *                         tripsByVehicleType:
 *                           type: object
 *                           additionalProperties:
 *                             type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Internal server error
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
 *                   example: Failed to get trip stats
 *                 messageAr:
 *                   type: string
 *                   example: فشل استرجاع إحصائيات الرحلات
 */
router.get('/trips/stats', adminController.getTripStats);

/**
 * @swagger
 * /admin/trips/{tripId}:
 *   get:
 *     summary: Get trip by ID
 *     description: Retrieves detailed information about a specific trip including passenger, driver, fare breakdown, and route details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the trip
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Trip retrieved successfully
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
 *                   example: Trip retrieved
 *                 messageAr:
 *                   type: string
 *                   example: تم استرجاع بيانات الرحلة
 *                 data:
 *                   type: object
 *                   properties:
 *                     trip:
 *                       $ref: '#/components/schemas/Trip'
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
 *                   example: Invalid trip ID
 *                 messageAr:
 *                   type: string
 *                   example: معرف الرحلة غير صالح
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Trip not found
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
 *                   example: Trip not found
 *                 messageAr:
 *                   type: string
 *                   example: لم يتم العثور على الرحلة
 */
router.get('/trips/:tripId', adminController.getTripById);

// ==================== Finance ====================

/**
 * @swagger
 * /admin/finance/stats:
 *   get:
 *     summary: Get finance statistics
 *     description: Retrieves comprehensive financial statistics including revenue, platform fees, and payment method breakdowns
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Finance statistics retrieved successfully
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
 *                   example: Finance stats retrieved
 *                 messageAr:
 *                   type: string
 *                   example: تم استرجاع الإحصائيات المالية
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalRevenue:
 *                           type: number
 *                           example: 150000
 *                         platformFees:
 *                           type: number
 *                           example: 30000
 *                         driverEarnings:
 *                           type: number
 *                           example: 120000
 *                         revenueToday:
 *                           type: number
 *                           example: 5000
 *                         revenueThisWeek:
 *                           type: number
 *                           example: 35000
 *                         revenueThisMonth:
 *                           type: number
 *                           example: 150000
 *                         averageTripValue:
 *                           type: number
 *                           example: 45
 *                         paymentMethodBreakdown:
 *                           type: object
 *                           properties:
 *                             cash:
 *                               type: number
 *                               example: 75000
 *                             card:
 *                               type: number
 *                               example: 50000
 *                             wallet:
 *                               type: number
 *                               example: 25000
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Internal server error
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
 *                   example: Failed to get finance stats
 *                 messageAr:
 *                   type: string
 *                   example: فشل استرجاع الإحصائيات المالية
 */
router.get('/finance/stats', adminController.getFinanceStats);

/**
 * @swagger
 * /admin/finance/revenue-chart:
 *   get:
 *     summary: Get revenue chart data
 *     description: Retrieves daily revenue data for chart visualization over a specified number of days
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *           minimum: 1
 *           maximum: 365
 *         description: Number of days of historical data to retrieve
 *     responses:
 *       200:
 *         description: Revenue chart data retrieved successfully
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
 *                   example: Revenue chart data retrieved
 *                 messageAr:
 *                   type: string
 *                   example: تم استرجاع بيانات الإيرادات
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                             example: "2024-01-15"
 *                           revenue:
 *                             type: number
 *                             example: 5250
 *                           trips:
 *                             type: integer
 *                             example: 117
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Internal server error
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
 *                   example: Failed to get revenue chart
 *                 messageAr:
 *                   type: string
 *                   example: فشل استرجاع بيانات الإيرادات
 */
router.get('/finance/revenue-chart', adminController.getRevenueChart);

// ==================== Settings ====================

/**
 * @swagger
 * /admin/settings/fares:
 *   get:
 *     summary: Get fare settings
 *     description: Retrieves all fare settings for different vehicle types
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fare settings retrieved successfully
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
 *                   example: Fare settings retrieved
 *                 messageAr:
 *                   type: string
 *                   example: تم استرجاع إعدادات الأسعار
 *                 data:
 *                   type: object
 *                   properties:
 *                     settings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FareSettings'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Internal server error
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
 *                   example: Failed to get fare settings
 *                 messageAr:
 *                   type: string
 *                   example: فشل استرجاع إعدادات الأسعار
 */
router.get('/settings/fares', adminController.getFareSettings);

/**
 * @swagger
 * /admin/settings/fares:
 *   post:
 *     summary: Create fare setting
 *     description: Creates a new fare setting for a vehicle type
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleType
 *               - baseFare
 *               - perKmRate
 *               - perMinuteRate
 *               - minimumFare
 *             properties:
 *               vehicleType:
 *                 type: string
 *                 enum: [economy, comfort, family, tuktuk, motorcycle]
 *                 example: economy
 *               baseFare:
 *                 type: number
 *                 example: 10
 *                 description: Base fare in EGP
 *               perKmRate:
 *                 type: number
 *                 example: 3
 *                 description: Rate per kilometer in EGP
 *               perMinuteRate:
 *                 type: number
 *                 example: 0.5
 *                 description: Rate per minute in EGP
 *               minimumFare:
 *                 type: number
 *                 example: 15
 *                 description: Minimum fare in EGP
 *               cancellationFee:
 *                 type: number
 *                 example: 10
 *                 description: Cancellation fee in EGP
 *               platformFeePercentage:
 *                 type: number
 *                 example: 20
 *                 description: Platform fee percentage (0-100)
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Fare setting created successfully
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
 *                   example: Fare setting created
 *                 messageAr:
 *                   type: string
 *                   example: تم إنشاء إعدادات السعر
 *                 data:
 *                   type: object
 *                   properties:
 *                     setting:
 *                       $ref: '#/components/schemas/FareSettings'
 *       400:
 *         description: Invalid request data or fare setting already exists
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
 *                   example: Fare setting for this vehicle type already exists
 *                 messageAr:
 *                   type: string
 *                   example: إعدادات السعر لهذا النوع موجودة بالفعل
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/settings/fares', adminController.createFareSetting);

/**
 * @swagger
 * /admin/settings/fares/{fareId}:
 *   put:
 *     summary: Update fare setting
 *     description: Updates an existing fare setting
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fareId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the fare setting
 *         example: 507f1f77bcf86cd799439011
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
 *                 description: Base fare in EGP
 *               perKmRate:
 *                 type: number
 *                 example: 3.5
 *                 description: Rate per kilometer in EGP
 *               perMinuteRate:
 *                 type: number
 *                 example: 0.6
 *                 description: Rate per minute in EGP
 *               minimumFare:
 *                 type: number
 *                 example: 18
 *                 description: Minimum fare in EGP
 *               cancellationFee:
 *                 type: number
 *                 example: 12
 *                 description: Cancellation fee in EGP
 *               platformFeePercentage:
 *                 type: number
 *                 example: 22
 *                 description: Platform fee percentage (0-100)
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Fare setting updated successfully
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
 *                   example: Fare setting updated
 *                 messageAr:
 *                   type: string
 *                   example: تم تحديث إعدادات السعر
 *                 data:
 *                   type: object
 *                   properties:
 *                     setting:
 *                       $ref: '#/components/schemas/FareSettings'
 *       400:
 *         description: Invalid fare ID format
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
 *                   example: Invalid fare ID
 *                 messageAr:
 *                   type: string
 *                   example: معرف السعر غير صالح
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Fare setting not found
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
 *                   example: Fare setting not found
 *                 messageAr:
 *                   type: string
 *                   example: لم يتم العثور على إعدادات السعر
 */
router.put('/settings/fares/:fareId', adminController.updateFareSetting);

/**
 * @swagger
 * /admin/settings/zones:
 *   get:
 *     summary: Get all zones
 *     description: Retrieves all geographic service zones
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Zones retrieved successfully
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
 *                   example: Zones retrieved
 *                 messageAr:
 *                   type: string
 *                   example: تم استرجاع المناطق
 *                 data:
 *                   type: object
 *                   properties:
 *                     zones:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Zone'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Internal server error
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
 *                   example: Failed to get zones
 *                 messageAr:
 *                   type: string
 *                   example: فشل استرجاع المناطق
 */
router.get('/settings/zones', adminController.getZones);

/**
 * @swagger
 * /admin/settings/zones:
 *   post:
 *     summary: Create zone
 *     description: Creates a new geographic service zone
 *     tags: [Admin]
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
 *               - nameAr
 *             properties:
 *               name:
 *                 type: string
 *                 example: Bagour Central
 *                 description: Zone name in English
 *               nameAr:
 *                 type: string
 *                 example: وسط الباجور
 *                 description: Zone name in Arabic
 *               isActive:
 *                 type: boolean
 *                 example: true
 *                 description: Whether the zone is active
 *               surgeMultiplier:
 *                 type: number
 *                 example: 1.0
 *                 minimum: 1
 *                 maximum: 3
 *                 description: Surge pricing multiplier for this zone
 *               boundaries:
 *                 type: object
 *                 description: GeoJSON polygon defining zone boundaries
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: Polygon
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: array
 *                       items:
 *                         type: array
 *                         items:
 *                           type: number
 *     responses:
 *       201:
 *         description: Zone created successfully
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
 *                   example: Zone created
 *                 messageAr:
 *                   type: string
 *                   example: تم إنشاء المنطقة
 *                 data:
 *                   type: object
 *                   properties:
 *                     zone:
 *                       $ref: '#/components/schemas/Zone'
 *       400:
 *         description: Invalid request data
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
 *                   example: Zone name is required
 *                 messageAr:
 *                   type: string
 *                   example: اسم المنطقة مطلوب
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/settings/zones', adminController.createZone);

/**
 * @swagger
 * /admin/settings/zones/{zoneId}:
 *   put:
 *     summary: Update zone
 *     description: Updates an existing geographic service zone
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: zoneId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the zone
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Bagour Central Updated
 *                 description: Zone name in English
 *               nameAr:
 *                 type: string
 *                 example: وسط الباجور المحدث
 *                 description: Zone name in Arabic
 *               isActive:
 *                 type: boolean
 *                 example: true
 *                 description: Whether the zone is active
 *               surgeMultiplier:
 *                 type: number
 *                 example: 1.2
 *                 minimum: 1
 *                 maximum: 3
 *                 description: Surge pricing multiplier for this zone
 *     responses:
 *       200:
 *         description: Zone updated successfully
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
 *                   example: Zone updated
 *                 messageAr:
 *                   type: string
 *                   example: تم تحديث المنطقة
 *                 data:
 *                   type: object
 *                   properties:
 *                     zone:
 *                       $ref: '#/components/schemas/Zone'
 *       400:
 *         description: Invalid zone ID format
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
 *                   example: Invalid zone ID
 *                 messageAr:
 *                   type: string
 *                   example: معرف المنطقة غير صالح
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Zone not found
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
 *                   example: Zone not found
 *                 messageAr:
 *                   type: string
 *                   example: لم يتم العثور على المنطقة
 */
router.put('/settings/zones/:zoneId', adminController.updateZone);

/**
 * @swagger
 * /admin/settings/zones/{zoneId}:
 *   delete:
 *     summary: Delete zone
 *     description: Deletes a geographic service zone
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: zoneId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the zone
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Zone deleted successfully
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
 *                   example: Zone deleted
 *                 messageAr:
 *                   type: string
 *                   example: تم حذف المنطقة
 *                 data:
 *                   type: null
 *       400:
 *         description: Invalid zone ID format
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
 *                   example: Invalid zone ID
 *                 messageAr:
 *                   type: string
 *                   example: معرف المنطقة غير صالح
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Internal server error
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
 *                   example: Failed to delete zone
 *                 messageAr:
 *                   type: string
 *                   example: فشل حذف المنطقة
 */
router.delete('/settings/zones/:zoneId', adminController.deleteZone);

export default router;
