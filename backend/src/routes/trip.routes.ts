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
 * @route   POST /api/v1/trips
 * @desc    Create a new trip
 * @access  Passenger only
 */
router.post(
  '/',
  authenticate,
  authorize('passenger'),
  createTripValidator,
  tripController.createTrip
);

/**
 * @route   GET /api/v1/trips
 * @desc    Get passenger trips
 * @access  Passenger only
 */
router.get(
  '/',
  authenticate,
  authorize('passenger'),
  tripListValidator,
  tripController.getPassengerTrips
);

/**
 * @route   GET /api/v1/trips/active
 * @desc    Get active trip for passenger
 * @access  Passenger only
 */
router.get(
  '/active',
  authenticate,
  authorize('passenger'),
  tripController.getActiveTrip
);

/**
 * @route   GET /api/v1/trips/:tripId
 * @desc    Get trip by ID
 * @access  Passenger, Driver (of the trip), Admin
 */
router.get(
  '/:tripId',
  authenticate,
  tripIdValidator,
  tripController.getTrip
);

/**
 * @route   PUT /api/v1/trips/:tripId/cancel
 * @desc    Cancel trip
 * @access  Passenger only
 */
router.put(
  '/:tripId/cancel',
  authenticate,
  authorize('passenger'),
  cancelTripValidator,
  tripController.cancelTrip
);

/**
 * @route   POST /api/v1/trips/:tripId/rate
 * @desc    Rate trip (passenger rates driver)
 * @access  Passenger only
 */
router.post(
  '/:tripId/rate',
  authenticate,
  authorize('passenger'),
  rateTripValidator,
  tripController.rateTrip
);

/**
 * @route   POST /api/v1/trips/:tripId/share
 * @desc    Share trip with contacts
 * @access  Passenger only
 */
router.post(
  '/:tripId/share',
  authenticate,
  authorize('passenger'),
  shareTripValidator,
  tripController.shareTrip
);

/**
 * @route   POST /api/v1/trips/:tripId/sos
 * @desc    Trigger SOS emergency
 * @access  Passenger or Driver (of the trip)
 */
router.post(
  '/:tripId/sos',
  authenticate,
  tripIdValidator,
  tripController.triggerSOS
);

export default router;
