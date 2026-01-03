import { Router } from 'express';
import safetyController from '../controllers/safety.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
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
} from '../validators/safety.validator';

const router = Router();

// ============================================
// Emergency Contacts Routes
// ============================================

/**
 * @route   GET /api/v1/safety/emergency-contacts
 * @desc    Get all emergency contacts
 * @access  Private (Passenger)
 */
router.get(
  '/emergency-contacts',
  authenticate,
  authorize('passenger'),
  safetyController.getEmergencyContacts
);

/**
 * @route   POST /api/v1/safety/emergency-contacts
 * @desc    Add emergency contact
 * @access  Private (Passenger)
 */
router.post(
  '/emergency-contacts',
  authenticate,
  authorize('passenger'),
  addEmergencyContactValidator,
  safetyController.addEmergencyContact
);

/**
 * @route   PUT /api/v1/safety/emergency-contacts/:contactId
 * @desc    Update emergency contact
 * @access  Private (Passenger)
 */
router.put(
  '/emergency-contacts/:contactId',
  authenticate,
  authorize('passenger'),
  updateEmergencyContactValidator,
  safetyController.updateEmergencyContact
);

/**
 * @route   DELETE /api/v1/safety/emergency-contacts/:contactId
 * @desc    Remove emergency contact
 * @access  Private (Passenger)
 */
router.delete(
  '/emergency-contacts/:contactId',
  authenticate,
  authorize('passenger'),
  removeEmergencyContactValidator,
  safetyController.removeEmergencyContact
);

// ============================================
// Safety Preferences Routes
// ============================================

/**
 * @route   GET /api/v1/safety/preferences
 * @desc    Get safety preferences
 * @access  Private (Passenger)
 */
router.get(
  '/preferences',
  authenticate,
  authorize('passenger'),
  safetyController.getSafetyPreferences
);

/**
 * @route   PUT /api/v1/safety/preferences
 * @desc    Update safety preferences
 * @access  Private (Passenger)
 */
router.put(
  '/preferences',
  authenticate,
  authorize('passenger'),
  updateSafetyPreferencesValidator,
  safetyController.updateSafetyPreferences
);

// ============================================
// Trip Sharing Routes
// ============================================

/**
 * @route   POST /api/v1/safety/trips/:tripId/share
 * @desc    Generate trip share link
 * @access  Private (Passenger)
 */
router.post(
  '/trips/:tripId/share',
  authenticate,
  authorize('passenger'),
  generateShareLinkValidator,
  safetyController.generateTripShareLink
);

/**
 * @route   GET /api/v1/safety/track/:tripId
 * @desc    Get trip for public tracking (with token)
 * @access  Public
 */
router.get(
  '/track/:tripId',
  getTripForTrackingValidator,
  safetyController.getTripForTracking
);

// ============================================
// SOS Routes
// ============================================

/**
 * @route   POST /api/v1/safety/trips/:tripId/sos
 * @desc    Trigger SOS for trip
 * @access  Private (Passenger, Driver)
 */
router.post(
  '/trips/:tripId/sos',
  authenticate,
  authorize('passenger', 'driver'),
  triggerSOSValidator,
  safetyController.triggerSOS
);

/**
 * @route   POST /api/v1/safety/trips/:tripId/sos/resolve
 * @desc    Resolve SOS event
 * @access  Private (Admin)
 */
router.post(
  '/trips/:tripId/sos/resolve',
  authenticate,
  authorize('admin'),
  resolveSOSValidator,
  safetyController.resolveSOS
);

// ============================================
// Safety Check Routes
// ============================================

/**
 * @route   POST /api/v1/safety/trips/:tripId/safety-check
 * @desc    Respond to safety check
 * @access  Private (Passenger)
 */
router.post(
  '/trips/:tripId/safety-check',
  authenticate,
  authorize('passenger'),
  safetyCheckResponseValidator,
  safetyController.respondToSafetyCheck
);

// ============================================
// Driver Verification Routes
// ============================================

/**
 * @route   GET /api/v1/safety/verify-driver/:driverId
 * @desc    Verify driver for trip
 * @access  Private (Passenger)
 */
router.get(
  '/verify-driver/:driverId',
  authenticate,
  authorize('passenger'),
  verifyDriverValidator,
  safetyController.verifyDriver
);

// ============================================
// Safety Tips Routes
// ============================================

/**
 * @route   GET /api/v1/safety/tips
 * @desc    Get safety tips
 * @access  Private (Passenger)
 */
router.get(
  '/tips',
  authenticate,
  authorize('passenger'),
  safetyController.getSafetyTips
);

export default router;
