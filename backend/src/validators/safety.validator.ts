import { body, param, query } from 'express-validator';

// Add emergency contact validator
export const addEmergencyContactValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .matches(/^(\+?20|0)?1[0125]\d{8}$/)
    .withMessage('Invalid Egyptian phone number'),

  body('relationship')
    .trim()
    .notEmpty()
    .withMessage('Relationship is required')
    .isIn(['parent', 'spouse', 'sibling', 'friend', 'other'])
    .withMessage('Invalid relationship type'),

  body('notifyOnTrip')
    .optional()
    .isBoolean()
    .withMessage('notifyOnTrip must be a boolean'),

  body('notifyOnSOS')
    .optional()
    .isBoolean()
    .withMessage('notifyOnSOS must be a boolean'),
];

// Update emergency contact validator
export const updateEmergencyContactValidator = [
  param('contactId')
    .isMongoId()
    .withMessage('Invalid contact ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters'),

  body('phone')
    .optional()
    .trim()
    .matches(/^(\+?20|0)?1[0125]\d{8}$/)
    .withMessage('Invalid Egyptian phone number'),

  body('relationship')
    .optional()
    .trim()
    .isIn(['parent', 'spouse', 'sibling', 'friend', 'other'])
    .withMessage('Invalid relationship type'),

  body('notifyOnTrip')
    .optional()
    .isBoolean()
    .withMessage('notifyOnTrip must be a boolean'),

  body('notifyOnSOS')
    .optional()
    .isBoolean()
    .withMessage('notifyOnSOS must be a boolean'),
];

// Remove emergency contact validator
export const removeEmergencyContactValidator = [
  param('contactId')
    .isMongoId()
    .withMessage('Invalid contact ID'),
];

// Update safety preferences validator
export const updateSafetyPreferencesValidator = [
  body('autoShareTrips')
    .optional()
    .isBoolean()
    .withMessage('autoShareTrips must be a boolean'),

  body('shareWithContacts')
    .optional()
    .isArray()
    .withMessage('shareWithContacts must be an array'),

  body('shareWithContacts.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid contact ID in shareWithContacts'),

  body('sendETAUpdates')
    .optional()
    .isBoolean()
    .withMessage('sendETAUpdates must be a boolean'),

  body('sosGestureEnabled')
    .optional()
    .isBoolean()
    .withMessage('sosGestureEnabled must be a boolean'),

  body('nightModeAlerts')
    .optional()
    .isBoolean()
    .withMessage('nightModeAlerts must be a boolean'),

  body('recordTrips')
    .optional()
    .isBoolean()
    .withMessage('recordTrips must be a boolean'),
];

// Generate share link validator
export const generateShareLinkValidator = [
  param('tripId')
    .isMongoId()
    .withMessage('Invalid trip ID'),

  body('expirationHours')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Expiration hours must be between 1 and 168'),
];

// Get trip for tracking validator
export const getTripForTrackingValidator = [
  param('tripId')
    .isMongoId()
    .withMessage('Invalid trip ID'),

  query('token')
    .notEmpty()
    .withMessage('Token is required')
    .isString()
    .withMessage('Token must be a string'),
];

// Trigger SOS validator
export const triggerSOSValidator = [
  param('tripId')
    .isMongoId()
    .withMessage('Invalid trip ID'),

  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),

  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
];

// Resolve SOS validator
export const resolveSOSValidator = [
  param('tripId')
    .isMongoId()
    .withMessage('Invalid trip ID'),

  body('notes')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
];

// Verify driver validator
export const verifyDriverValidator = [
  param('driverId')
    .isMongoId()
    .withMessage('Invalid driver ID'),
];

// Safety check response validator
export const safetyCheckResponseValidator = [
  param('tripId')
    .isMongoId()
    .withMessage('Invalid trip ID'),

  body('response')
    .isIn(['safe', 'need_help'])
    .withMessage('Response must be "safe" or "need_help"'),
];

export default {
  addEmergencyContactValidator,
  updateEmergencyContactValidator,
  removeEmergencyContactValidator,
  updateSafetyPreferencesValidator,
  generateShareLinkValidator,
  getTripForTrackingValidator,
  triggerSOSValidator,
  resolveSOSValidator,
  verifyDriverValidator,
  safetyCheckResponseValidator,
};
