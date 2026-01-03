import { body, param, query } from 'express-validator';

export const createTripValidator = [
  body('pickup')
    .notEmpty()
    .withMessage('Pickup location is required')
    .isObject()
    .withMessage('Pickup must be an object'),
  body('pickup.address')
    .notEmpty()
    .withMessage('Pickup address is required')
    .isString()
    .trim(),
  body('pickup.latitude')
    .notEmpty()
    .withMessage('Pickup latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid pickup latitude'),
  body('pickup.longitude')
    .notEmpty()
    .withMessage('Pickup longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid pickup longitude'),
  body('pickup.landmark')
    .optional()
    .isString()
    .trim(),
  body('dropoff')
    .notEmpty()
    .withMessage('Dropoff location is required')
    .isObject()
    .withMessage('Dropoff must be an object'),
  body('dropoff.address')
    .notEmpty()
    .withMessage('Dropoff address is required')
    .isString()
    .trim(),
  body('dropoff.latitude')
    .notEmpty()
    .withMessage('Dropoff latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid dropoff latitude'),
  body('dropoff.longitude')
    .notEmpty()
    .withMessage('Dropoff longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid dropoff longitude'),
  body('dropoff.landmark')
    .optional()
    .isString()
    .trim(),
  body('stops')
    .optional()
    .isArray({ max: 3 })
    .withMessage('Maximum 3 stops allowed'),
  body('stops.*.address')
    .optional()
    .isString()
    .trim(),
  body('stops.*.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 }),
  body('stops.*.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 }),
  body('rideType')
    .notEmpty()
    .withMessage('Ride type is required')
    .isIn(['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'])
    .withMessage('Invalid ride type'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'wallet'])
    .withMessage('Invalid payment method'),
  body('scheduledTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid scheduled time format')
    .custom((value) => {
      const scheduledDate = new Date(value);
      const now = new Date();
      const minTime = new Date(now.getTime() + 15 * 60 * 1000); // At least 15 minutes from now
      if (scheduledDate < minTime) {
        throw new Error('Scheduled time must be at least 15 minutes from now');
      }
      return true;
    }),
  body('promoCode')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 20 }),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 }),
];

export const tripIdValidator = [
  param('tripId')
    .notEmpty()
    .withMessage('Trip ID is required')
    .isMongoId()
    .withMessage('Invalid trip ID'),
];

export const cancelTripValidator = [
  param('tripId')
    .notEmpty()
    .withMessage('Trip ID is required')
    .isMongoId()
    .withMessage('Invalid trip ID'),
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 }),
];

export const rateTripValidator = [
  param('tripId')
    .notEmpty()
    .withMessage('Trip ID is required')
    .isMongoId()
    .withMessage('Invalid trip ID'),
  body('score')
    .notEmpty()
    .withMessage('Rating score is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Score must be between 1 and 5'),
  body('comment')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 }),
  body('badges')
    .optional()
    .isArray()
    .withMessage('Badges must be an array'),
  body('badges.*')
    .optional()
    .isString(),
];

export const shareTripValidator = [
  param('tripId')
    .notEmpty()
    .withMessage('Trip ID is required')
    .isMongoId()
    .withMessage('Invalid trip ID'),
  body('contacts')
    .notEmpty()
    .withMessage('Contacts are required')
    .isArray({ min: 1, max: 5 })
    .withMessage('1-5 contacts allowed'),
  body('contacts.*.name')
    .notEmpty()
    .withMessage('Contact name is required')
    .isString()
    .trim(),
  body('contacts.*.phone')
    .notEmpty()
    .withMessage('Contact phone is required')
    .matches(/^\+?[0-9]{10,14}$/)
    .withMessage('Invalid phone number'),
];

export const tripListValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('status')
    .optional()
    .isIn([
      'searching',
      'driver_assigned',
      'driver_arriving',
      'driver_arrived',
      'trip_started',
      'trip_completed',
      'cancelled',
    ])
    .withMessage('Invalid status'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
];

export const driverTripActionValidator = [
  param('tripId')
    .notEmpty()
    .withMessage('Trip ID is required')
    .isMongoId()
    .withMessage('Invalid trip ID'),
];

export default {
  createTripValidator,
  tripIdValidator,
  cancelTripValidator,
  rateTripValidator,
  shareTripValidator,
  tripListValidator,
  driverTripActionValidator,
};
