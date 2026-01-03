import { Router } from 'express';
import tripController from '../controllers/trip.controller';
import {
  tripListValidator,
  driverTripActionValidator,
  rateTripValidator,
  cancelTripValidator,
} from '../validators/trip.validator';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// ==================== Driver Trip Routes ====================

/**
 * @route   GET /api/v1/driver/trips
 * @desc    Get driver trips
 * @access  Driver only
 */
router.get(
  '/trips',
  authenticate,
  authorize('driver'),
  tripListValidator,
  tripController.getDriverTrips
);

/**
 * @route   GET /api/v1/driver/trips/active
 * @desc    Get active trip for driver
 * @access  Driver only
 */
router.get(
  '/trips/active',
  authenticate,
  authorize('driver'),
  tripController.getDriverActiveTrip
);

/**
 * @route   GET /api/v1/driver/trips/available
 * @desc    Get pending trip request for driver
 * @access  Driver only
 */
router.get(
  '/trips/available',
  authenticate,
  authorize('driver'),
  tripController.getAvailableTrips
);

/**
 * @route   PUT /api/v1/driver/trips/:tripId/accept
 * @desc    Accept trip request
 * @access  Driver only
 */
router.put(
  '/trips/:tripId/accept',
  authenticate,
  authorize('driver'),
  driverTripActionValidator,
  tripController.acceptTrip
);

/**
 * @route   PUT /api/v1/driver/trips/:tripId/reject
 * @desc    Reject trip request
 * @access  Driver only
 */
router.put(
  '/trips/:tripId/reject',
  authenticate,
  authorize('driver'),
  driverTripActionValidator,
  tripController.rejectTrip
);

/**
 * @route   PUT /api/v1/driver/trips/:tripId/status
 * @desc    Update trip status
 * @access  Driver only
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
 * @route   PUT /api/v1/driver/trips/:tripId/complete
 * @desc    Complete trip
 * @access  Driver only
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
 * @route   PUT /api/v1/driver/trips/:tripId/cancel
 * @desc    Cancel trip (driver)
 * @access  Driver only
 */
router.put(
  '/trips/:tripId/cancel',
  authenticate,
  authorize('driver'),
  cancelTripValidator,
  tripController.driverCancelTrip
);

/**
 * @route   POST /api/v1/driver/trips/:tripId/rate
 * @desc    Rate passenger
 * @access  Driver only
 */
router.post(
  '/trips/:tripId/rate',
  authenticate,
  authorize('driver'),
  rateTripValidator,
  tripController.ratePassenger
);

export default router;
