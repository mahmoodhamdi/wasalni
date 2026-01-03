import { Router } from 'express';
import { authenticate, adminOnly, anyRole } from '../middleware/auth.middleware';
import promoController from '../controllers/promo.controller';
import {
  validatePromoValidator,
  createPromoValidator,
  updatePromoValidator,
  getPromoByIdValidator,
  availablePromosValidator,
} from '../validators/promo.validator';

const router = Router();

// ==================== User Routes ====================

/**
 * @route   POST /api/v1/promo/validate
 * @desc    Validate a promo code
 * @access  Private (Any authenticated user)
 */
router.post(
  '/validate',
  authenticate,
  anyRole,
  validatePromoValidator,
  promoController.validatePromo
);

/**
 * @route   GET /api/v1/promo/available
 * @desc    Get available promo codes for user
 * @access  Private (Any authenticated user)
 */
router.get(
  '/available',
  authenticate,
  anyRole,
  availablePromosValidator,
  promoController.getAvailablePromos
);

/**
 * @route   GET /api/v1/promo/history
 * @desc    Get user's promo usage history
 * @access  Private (Any authenticated user)
 */
router.get('/history', authenticate, anyRole, promoController.getPromoHistory);

// ==================== Admin Routes ====================

/**
 * @route   POST /api/v1/promo
 * @desc    Create a new promo code
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  adminOnly,
  createPromoValidator,
  promoController.createPromo
);

/**
 * @route   GET /api/v1/promo
 * @desc    Get all promo codes
 * @access  Private (Admin only)
 */
router.get('/', authenticate, adminOnly, promoController.getAllPromos);

/**
 * @route   GET /api/v1/promo/:promoId
 * @desc    Get promo code by ID
 * @access  Private (Admin only)
 */
router.get(
  '/:promoId',
  authenticate,
  adminOnly,
  getPromoByIdValidator,
  promoController.getPromoById
);

/**
 * @route   GET /api/v1/promo/:promoId/stats
 * @desc    Get promo code statistics
 * @access  Private (Admin only)
 */
router.get(
  '/:promoId/stats',
  authenticate,
  adminOnly,
  getPromoByIdValidator,
  promoController.getPromoStats
);

/**
 * @route   PUT /api/v1/promo/:promoId
 * @desc    Update promo code
 * @access  Private (Admin only)
 */
router.put(
  '/:promoId',
  authenticate,
  adminOnly,
  updatePromoValidator,
  promoController.updatePromo
);

/**
 * @route   DELETE /api/v1/promo/:promoId
 * @desc    Deactivate promo code
 * @access  Private (Admin only)
 */
router.delete(
  '/:promoId',
  authenticate,
  adminOnly,
  getPromoByIdValidator,
  promoController.deactivatePromo
);

export default router;
