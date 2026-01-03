import { Router } from 'express';
import { authenticate, adminOnly } from '../middleware/auth.middleware';
import adminController from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(adminOnly);

// ==================== Dashboard ====================

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/stats', adminController.getDashboardStats);

// ==================== Passengers ====================

/**
 * @route   GET /api/v1/admin/passengers
 * @desc    Get all passengers with pagination
 * @access  Private (Admin only)
 */
router.get('/passengers', adminController.getPassengers);

/**
 * @route   GET /api/v1/admin/passengers/:passengerId
 * @desc    Get passenger by ID
 * @access  Private (Admin only)
 */
router.get('/passengers/:passengerId', adminController.getPassengerById);

/**
 * @route   PUT /api/v1/admin/passengers/:passengerId
 * @desc    Update passenger
 * @access  Private (Admin only)
 */
router.put('/passengers/:passengerId', adminController.updatePassenger);

/**
 * @route   PUT /api/v1/admin/passengers/:passengerId/toggle-active
 * @desc    Toggle passenger active status
 * @access  Private (Admin only)
 */
router.put('/passengers/:passengerId/toggle-active', adminController.togglePassengerActive);

// ==================== Drivers ====================

/**
 * @route   GET /api/v1/admin/drivers
 * @desc    Get all drivers with pagination
 * @access  Private (Admin only)
 */
router.get('/drivers', adminController.getDrivers);

/**
 * @route   GET /api/v1/admin/drivers/pending
 * @desc    Get pending driver approvals
 * @access  Private (Admin only)
 */
router.get('/drivers/pending', adminController.getPendingDrivers);

/**
 * @route   GET /api/v1/admin/drivers/recent
 * @desc    Get recent drivers (alias for pending)
 * @access  Private (Admin only)
 */
router.get('/drivers/recent', adminController.getPendingDrivers);

/**
 * @route   GET /api/v1/admin/drivers/:driverId
 * @desc    Get driver by ID
 * @access  Private (Admin only)
 */
router.get('/drivers/:driverId', adminController.getDriverById);

/**
 * @route   PUT /api/v1/admin/drivers/:driverId/approve
 * @desc    Approve driver
 * @access  Private (Admin only)
 */
router.put('/drivers/:driverId/approve', adminController.approveDriver);

/**
 * @route   PUT /api/v1/admin/drivers/:driverId/reject
 * @desc    Reject driver
 * @access  Private (Admin only)
 */
router.put('/drivers/:driverId/reject', adminController.rejectDriver);

/**
 * @route   PUT /api/v1/admin/drivers/:driverId/suspend
 * @desc    Suspend driver
 * @access  Private (Admin only)
 */
router.put('/drivers/:driverId/suspend', adminController.suspendDriver);

/**
 * @route   PUT /api/v1/admin/drivers/:driverId/activate
 * @desc    Activate suspended driver
 * @access  Private (Admin only)
 */
router.put('/drivers/:driverId/activate', adminController.activateDriver);

// ==================== Trips ====================

/**
 * @route   GET /api/v1/admin/trips
 * @desc    Get all trips with pagination
 * @access  Private (Admin only)
 */
router.get('/trips', adminController.getTrips);

/**
 * @route   GET /api/v1/admin/trips/recent
 * @desc    Get recent trips
 * @access  Private (Admin only)
 */
router.get('/trips/recent', adminController.getRecentTrips);

/**
 * @route   GET /api/v1/admin/trips/stats
 * @desc    Get trip statistics
 * @access  Private (Admin only)
 */
router.get('/trips/stats', adminController.getTripStats);

/**
 * @route   GET /api/v1/admin/trips/:tripId
 * @desc    Get trip by ID
 * @access  Private (Admin only)
 */
router.get('/trips/:tripId', adminController.getTripById);

// ==================== Finance ====================

/**
 * @route   GET /api/v1/admin/finance/stats
 * @desc    Get finance statistics
 * @access  Private (Admin only)
 */
router.get('/finance/stats', adminController.getFinanceStats);

/**
 * @route   GET /api/v1/admin/finance/revenue-chart
 * @desc    Get revenue chart data
 * @access  Private (Admin only)
 */
router.get('/finance/revenue-chart', adminController.getRevenueChart);

// ==================== Settings ====================

/**
 * @route   GET /api/v1/admin/settings/fares
 * @desc    Get fare settings
 * @access  Private (Admin only)
 */
router.get('/settings/fares', adminController.getFareSettings);

/**
 * @route   POST /api/v1/admin/settings/fares
 * @desc    Create fare setting
 * @access  Private (Admin only)
 */
router.post('/settings/fares', adminController.createFareSetting);

/**
 * @route   PUT /api/v1/admin/settings/fares/:fareId
 * @desc    Update fare setting
 * @access  Private (Admin only)
 */
router.put('/settings/fares/:fareId', adminController.updateFareSetting);

/**
 * @route   GET /api/v1/admin/settings/zones
 * @desc    Get all zones
 * @access  Private (Admin only)
 */
router.get('/settings/zones', adminController.getZones);

/**
 * @route   POST /api/v1/admin/settings/zones
 * @desc    Create zone
 * @access  Private (Admin only)
 */
router.post('/settings/zones', adminController.createZone);

/**
 * @route   PUT /api/v1/admin/settings/zones/:zoneId
 * @desc    Update zone
 * @access  Private (Admin only)
 */
router.put('/settings/zones/:zoneId', adminController.updateZone);

/**
 * @route   DELETE /api/v1/admin/settings/zones/:zoneId
 * @desc    Delete zone
 * @access  Private (Admin only)
 */
router.delete('/settings/zones/:zoneId', adminController.deleteZone);

export default router;
