import { Router } from 'express';
import fareController from '../controllers/fare.controller';
import {
  fareEstimateValidator,
  fareCalculateValidator,
  promoValidateValidator,
  fareSettingsUpdateValidator,
} from '../validators/fare.validator';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/v1/fare/estimate
 * @desc    Get fare estimate for a trip
 * @access  Public
 */
router.post('/estimate', fareEstimateValidator, fareController.getFareEstimate);

/**
 * @route   POST /api/v1/fare/calculate
 * @desc    Calculate final fare for a trip
 * @access  Private (authenticated users)
 */
router.post(
  '/calculate',
  authenticate,
  fareCalculateValidator,
  fareController.calculateFare
);

/**
 * @route   GET /api/v1/fare/settings
 * @desc    Get all fare settings
 * @access  Public
 */
router.get('/settings', fareController.getFareSettings);

/**
 * @route   PUT /api/v1/fare/settings/:rideType
 * @desc    Update fare settings
 * @access  Admin only
 */
router.put(
  '/settings/:rideType',
  authenticate,
  authorize('admin'),
  fareSettingsUpdateValidator,
  fareController.updateFareSettings
);

/**
 * @route   GET /api/v1/fare/surge
 * @desc    Get current surge info
 * @access  Public
 */
router.get('/surge', fareController.getSurgeInfo);

/**
 * @route   POST /api/v1/promo/validate
 * @desc    Validate a promo code
 * @access  Private (authenticated users)
 */
router.post(
  '/promo/validate',
  authenticate,
  promoValidateValidator,
  fareController.validatePromoCode
);

export default router;
