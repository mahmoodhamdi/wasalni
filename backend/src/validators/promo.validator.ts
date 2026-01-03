import { body, param, query } from 'express-validator';

// Valid promo types
const PROMO_TYPES = ['percentage', 'fixed'];
const RIDE_TYPES = ['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'];

/**
 * Validate promo code validation request
 */
export const validatePromoValidator = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Promo code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Promo code must be 3-20 characters')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Promo code must contain only letters and numbers'),

  body('fare')
    .isFloat({ min: 0 })
    .withMessage('Fare must be a positive number'),

  body('rideType')
    .trim()
    .notEmpty()
    .withMessage('Ride type is required')
    .isIn(RIDE_TYPES)
    .withMessage(`Ride type must be one of: ${RIDE_TYPES.join(', ')}`),
];

/**
 * Create promo code validation (Admin)
 */
export const createPromoValidator = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Promo code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Promo code must be 3-20 characters')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Promo code must contain only letters and numbers'),

  body('type')
    .trim()
    .notEmpty()
    .withMessage('Promo type is required')
    .isIn(PROMO_TYPES)
    .withMessage(`Promo type must be one of: ${PROMO_TYPES.join(', ')}`),

  body('value')
    .isFloat({ min: 0.01 })
    .withMessage('Value must be greater than 0')
    .custom((value, { req }) => {
      if (req.body.type === 'percentage' && (value <= 0 || value > 100)) {
        throw new Error('Percentage value must be between 1 and 100');
      }
      return true;
    }),

  body('maxDiscount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max discount must be a positive number'),

  body('minFare')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min fare must be a positive number'),

  body('usageLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Usage limit must be at least 1'),

  body('perUserLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Per user limit must be at least 1'),

  body('validFrom')
    .notEmpty()
    .withMessage('Valid from date is required')
    .isISO8601()
    .withMessage('Valid from must be a valid date'),

  body('validUntil')
    .notEmpty()
    .withMessage('Valid until date is required')
    .isISO8601()
    .withMessage('Valid until must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.validFrom)) {
        throw new Error('Valid until must be after valid from');
      }
      return true;
    }),

  body('rideTypes')
    .optional()
    .isArray()
    .withMessage('Ride types must be an array'),

  body('rideTypes.*')
    .optional()
    .isIn(RIDE_TYPES)
    .withMessage(`Each ride type must be one of: ${RIDE_TYPES.join(', ')}`),

  body('newUsersOnly')
    .optional()
    .isBoolean()
    .withMessage('New users only must be a boolean'),

  body('userIds')
    .optional()
    .isArray()
    .withMessage('User IDs must be an array'),

  body('userIds.*')
    .optional()
    .isMongoId()
    .withMessage('Each user ID must be a valid ID'),
];

/**
 * Update promo code validation (Admin)
 */
export const updatePromoValidator = [
  param('promoId')
    .isMongoId()
    .withMessage('Invalid promo ID'),

  body('code')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Promo code must be 3-20 characters')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Promo code must contain only letters and numbers'),

  body('type')
    .optional()
    .trim()
    .isIn(PROMO_TYPES)
    .withMessage(`Promo type must be one of: ${PROMO_TYPES.join(', ')}`),

  body('value')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Value must be greater than 0'),

  body('maxDiscount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max discount must be a positive number'),

  body('minFare')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min fare must be a positive number'),

  body('usageLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Usage limit must be at least 1'),

  body('perUserLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Per user limit must be at least 1'),

  body('validFrom')
    .optional()
    .isISO8601()
    .withMessage('Valid from must be a valid date'),

  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Valid until must be a valid date'),

  body('rideTypes')
    .optional()
    .isArray()
    .withMessage('Ride types must be an array'),

  body('newUsersOnly')
    .optional()
    .isBoolean()
    .withMessage('New users only must be a boolean'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
];

/**
 * Get promo by ID validation
 */
export const getPromoByIdValidator = [
  param('promoId')
    .isMongoId()
    .withMessage('Invalid promo ID'),
];

/**
 * Available promos query validation
 */
export const availablePromosValidator = [
  query('rideType')
    .optional()
    .isIn(RIDE_TYPES)
    .withMessage(`Ride type must be one of: ${RIDE_TYPES.join(', ')}`),

  query('fare')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fare must be a positive number'),
];

export default {
  validatePromoValidator,
  createPromoValidator,
  updatePromoValidator,
  getPromoByIdValidator,
  availablePromosValidator,
};
