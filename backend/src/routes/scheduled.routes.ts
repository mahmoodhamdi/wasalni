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
 * @route   POST /api/v1/scheduled
 * @desc    Create a scheduled trip
 * @access  Private (Passenger)
 */
router.post('/', createScheduledTripValidator, scheduledController.createScheduledTrip);

/**
 * @route   GET /api/v1/scheduled
 * @desc    Get upcoming scheduled trips
 * @access  Private (Passenger)
 */
router.get('/', scheduledController.getUpcomingTrips);

/**
 * @route   GET /api/v1/scheduled/stats
 * @desc    Get scheduled trips statistics
 * @access  Private (Passenger)
 */
router.get('/stats', getStatsValidator, scheduledController.getTripsStats);

/**
 * @route   GET /api/v1/scheduled/slots
 * @desc    Get available time slots for a date
 * @access  Private (Passenger)
 */
router.get('/slots', getAvailableSlotsValidator, scheduledController.getAvailableSlots);

/**
 * @route   GET /api/v1/scheduled/:tripId
 * @desc    Get scheduled trip details
 * @access  Private (Passenger)
 */
router.get('/:tripId', getTripDetailsValidator, scheduledController.getTripDetails);

/**
 * @route   PATCH /api/v1/scheduled/:tripId/time
 * @desc    Modify scheduled trip time
 * @access  Private (Passenger)
 */
router.patch('/:tripId/time', modifyTripTimeValidator, scheduledController.modifyTripTime);

/**
 * @route   POST /api/v1/scheduled/:tripId/cancel
 * @desc    Cancel scheduled trip
 * @access  Private (Passenger)
 */
router.post('/:tripId/cancel', cancelTripValidator, scheduledController.cancelTrip);

export default router;
