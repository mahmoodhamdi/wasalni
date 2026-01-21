import { body } from 'express-validator';

export const fareEstimateValidator = [
  body('origin')
    .notEmpty()
    .withMessage('Origin is required')
    .isObject()
    .withMessage('Origin must be an object'),
  body('origin.lat')
    .notEmpty()
    .withMessage('Origin latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid origin latitude'),
  body('origin.lng')
    .notEmpty()
    .withMessage('Origin longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid origin longitude'),
  body('destination')
    .notEmpty()
    .withMessage('Destination is required')
    .isObject()
    .withMessage('Destination must be an object'),
  body('destination.lat')
    .notEmpty()
    .withMessage('Destination latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid destination latitude'),
  body('destination.lng')
    .notEmpty()
    .withMessage('Destination longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid destination longitude'),
  body('rideType')
    .optional()
    .isIn(['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'])
    .withMessage('Invalid ride type'),
];

export const fareCalculateValidator = [
  body('rideType')
    .notEmpty()
    .withMessage('Ride type is required')
    .isIn(['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'])
    .withMessage('Invalid ride type'),
  body('distance')
    .notEmpty()
    .withMessage('Distance is required')
    .isFloat({ min: 0 })
    .withMessage('Distance must be a positive number'),
  body('duration')
    .notEmpty()
    .withMessage('Duration is required')
    .isFloat({ min: 0 })
    .withMessage('Duration must be a positive number'),
  body('waitingTime')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Waiting time must be a positive number'),
  body('promoCode')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Promo code must be between 3 and 20 characters'),
];

export const promoValidateValidator = [
  body('code')
    .notEmpty()
    .withMessage('Promo code is required')
    .isString()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Promo code must be between 3 and 20 characters'),
  body('fare')
    .notEmpty()
    .withMessage('Fare amount is required')
    .isFloat({ min: 0 })
    .withMessage('Fare must be a positive number'),
  body('rideType')
    .notEmpty()
    .withMessage('Ride type is required')
    .isIn(['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'])
    .withMessage('Invalid ride type'),
];

export const fareSettingsUpdateValidator = [
  body('baseFare')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base fare must be a positive number'),
  body('perKm')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Per km rate must be a positive number'),
  body('perMinute')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Per minute rate must be a positive number'),
  body('minimumFare')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum fare must be a positive number'),
  body('bookingFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Booking fee must be a positive number'),
  body('waitingFare.freeMinutes')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Free minutes must be a positive number'),
  body('waitingFare.perMinute')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Waiting per minute rate must be a positive number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export default {
  fareEstimateValidator,
  fareCalculateValidator,
  promoValidateValidator,
  fareSettingsUpdateValidator,
};
