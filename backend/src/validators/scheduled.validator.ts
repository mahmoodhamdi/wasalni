import { body, param, query } from 'express-validator';

// Valid ride types
const RIDE_TYPES = ['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'];
const PAYMENT_METHODS = ['cash', 'wallet', 'card'];

/**
 * Validate location object
 */
const locationValidation = (fieldName: string) => [
  body(`${fieldName}.address`)
    .trim()
    .notEmpty()
    .withMessage(`${fieldName} address is required`)
    .isLength({ min: 5, max: 500 })
    .withMessage(`${fieldName} address must be between 5 and 500 characters`),
  body(`${fieldName}.latitude`)
    .isFloat({ min: -90, max: 90 })
    .withMessage(`${fieldName} latitude must be between -90 and 90`),
  body(`${fieldName}.longitude`)
    .isFloat({ min: -180, max: 180 })
    .withMessage(`${fieldName} longitude must be between -180 and 180`),
  body(`${fieldName}.name`)
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage(`${fieldName} name must be less than 200 characters`),
];

/**
 * Create scheduled trip validation
 */
export const createScheduledTripValidator = [
  ...locationValidation('pickup'),
  ...locationValidation('dropoff'),

  body('stops')
    .optional()
    .isArray({ max: 3 })
    .withMessage('Maximum 3 stops allowed'),

  body('stops.*.address')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Stop address is required'),

  body('stops.*.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Stop latitude must be between -90 and 90'),

  body('stops.*.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Stop longitude must be between -180 and 180'),

  body('rideType')
    .trim()
    .notEmpty()
    .withMessage('Ride type is required')
    .isIn(RIDE_TYPES)
    .withMessage(`Ride type must be one of: ${RIDE_TYPES.join(', ')}`),

  body('scheduledTime')
    .notEmpty()
    .withMessage('Scheduled time is required')
    .isISO8601()
    .withMessage('Scheduled time must be a valid date')
    .custom((value) => {
      const scheduledDate = new Date(value);
      const now = new Date();
      const minTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
      const maxTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      if (scheduledDate < minTime) {
        throw new Error('Scheduled time must be at least 30 minutes in the future');
      }
      if (scheduledDate > maxTime) {
        throw new Error('Cannot schedule more than 7 days in advance');
      }
      return true;
    }),

  body('paymentMethod')
    .optional()
    .isIn(PAYMENT_METHODS)
    .withMessage(`Payment method must be one of: ${PAYMENT_METHODS.join(', ')}`),

  body('promoCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Promo code must be less than 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Promo code must contain only uppercase letters and numbers'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
];

/**
 * Modify trip time validation
 */
export const modifyTripTimeValidator = [
  param('tripId')
    .isMongoId()
    .withMessage('Invalid trip ID'),

  body('scheduledTime')
    .notEmpty()
    .withMessage('New scheduled time is required')
    .isISO8601()
    .withMessage('Scheduled time must be a valid date')
    .custom((value) => {
      const scheduledDate = new Date(value);
      const now = new Date();
      const minTime = new Date(now.getTime() + 30 * 60 * 1000);
      const maxTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      if (scheduledDate < minTime) {
        throw new Error('Scheduled time must be at least 30 minutes in the future');
      }
      if (scheduledDate > maxTime) {
        throw new Error('Cannot schedule more than 7 days in advance');
      }
      return true;
    }),
];

/**
 * Cancel trip validation
 */
export const cancelTripValidator = [
  param('tripId')
    .isMongoId()
    .withMessage('Invalid trip ID'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),
];

/**
 * Get trip details validation
 */
export const getTripDetailsValidator = [
  param('tripId')
    .isMongoId()
    .withMessage('Invalid trip ID'),
];

/**
 * Get stats validation
 */
export const getStatsValidator = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (req.query?.startDate && value) {
        const start = new Date(req.query.startDate as string);
        const end = new Date(value);
        if (end < start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
];

/**
 * Get available slots validation
 */
export const getAvailableSlotsValidator = [
  query('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date format')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (date < today) {
        throw new Error('Cannot get slots for past dates');
      }

      const maxDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (date > maxDate) {
        throw new Error('Cannot get slots more than 7 days in advance');
      }

      return true;
    }),
];

export default {
  createScheduledTripValidator,
  modifyTripTimeValidator,
  cancelTripValidator,
  getTripDetailsValidator,
  getStatsValidator,
  getAvailableSlotsValidator,
};
