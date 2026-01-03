import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { validationResult } from 'express-validator';
import promoService from '../services/promo.service';
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendBadRequest,
  sendNotFound,
  sendUnauthorized,
} from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Validate promo code
 */
export const validatePromo = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendBadRequest(res, 'Validation failed', 'فشل التحقق من البيانات');
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      sendUnauthorized(res, 'User not found', 'لم يتم العثور على المستخدم');
      return;
    }

    const { code, fare, rideType } = req.body;

    const result = await promoService.validatePromoCode(
      code,
      new Types.ObjectId(userId),
      fare,
      rideType
    );

    if (result.valid) {
      sendSuccess(
        res,
        {
          valid: true,
          discount: result.discount,
          discountType: result.discountType,
          promoCode: code.toUpperCase(),
        },
        result.message,
        result.messageAr
      );
    } else {
      sendBadRequest(res, result.message, result.messageAr);
    }
  } catch (error: any) {
    logger.error(`Validate promo error: ${error.message}`);
    sendError(res, 'Failed to validate promo code', 'فشل التحقق من كود الخصم');
  }
};

/**
 * Get available promos for user
 */
export const getAvailablePromos = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendUnauthorized(res, 'User not found', 'لم يتم العثور على المستخدم');
      return;
    }

    const { rideType, fare } = req.query;

    const promos = await promoService.getAvailablePromos(
      new Types.ObjectId(userId),
      {
        rideType: rideType as string,
        fare: fare ? parseFloat(fare as string) : undefined,
      }
    );

    sendSuccess(res, { promos, count: promos.length }, 'Promos retrieved', 'تم استرجاع العروض');
  } catch (error: any) {
    logger.error(`Get available promos error: ${error.message}`);
    sendError(res, 'Failed to get promos', 'فشل استرجاع العروض');
  }
};

/**
 * Get promo usage history
 */
export const getPromoHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendUnauthorized(res, 'User not found', 'لم يتم العثور على المستخدم');
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await promoService.getPromoUsageHistory(
      new Types.ObjectId(userId),
      { page, limit }
    );

    sendSuccess(res, result, 'Usage history retrieved', 'تم استرجاع سجل الاستخدام');
  } catch (error: any) {
    logger.error(`Get promo history error: ${error.message}`);
    sendError(res, 'Failed to get usage history', 'فشل استرجاع سجل الاستخدام');
  }
};

// ==================== Admin Endpoints ====================

/**
 * Create promo code (Admin)
 */
export const createPromo = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendBadRequest(res, 'Validation failed', 'فشل التحقق من البيانات');
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      sendUnauthorized(res, 'Admin not found', 'لم يتم العثور على المسؤول');
      return;
    }

    const {
      code,
      type,
      value,
      maxDiscount,
      minFare,
      usageLimit,
      perUserLimit,
      validFrom,
      validUntil,
      rideTypes,
      newUsersOnly,
      userIds,
    } = req.body;

    const promo = await promoService.createPromoCode({
      code,
      type,
      value,
      maxDiscount,
      minFare,
      usageLimit,
      perUserLimit,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      rideTypes,
      newUsersOnly,
      userIds: userIds?.map((id: string) => new Types.ObjectId(id)),
      createdBy: new Types.ObjectId(userId),
    });

    sendCreated(res, { promo }, 'Promo code created', 'تم إنشاء كود الخصم');
  } catch (error: any) {
    logger.error(`Create promo error: ${error.message}`);
    sendBadRequest(res, error.message, error.message);
  }
};

/**
 * Update promo code (Admin)
 */
export const updatePromo = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendBadRequest(res, 'Validation failed', 'فشل التحقق من البيانات');
      return;
    }

    const { promoId } = req.params;
    if (!Types.ObjectId.isValid(promoId)) {
      sendBadRequest(res, 'Invalid promo ID', 'معرف الكود غير صالح');
      return;
    }

    const updates = req.body;
    if (updates.validFrom) updates.validFrom = new Date(updates.validFrom);
    if (updates.validUntil) updates.validUntil = new Date(updates.validUntil);
    if (updates.userIds) {
      updates.userIds = updates.userIds.map((id: string) => new Types.ObjectId(id));
    }

    const promo = await promoService.updatePromoCode(
      new Types.ObjectId(promoId),
      updates
    );

    sendSuccess(res, { promo }, 'Promo code updated', 'تم تحديث كود الخصم');
  } catch (error: any) {
    logger.error(`Update promo error: ${error.message}`);
    sendBadRequest(res, error.message, error.message);
  }
};

/**
 * Deactivate promo code (Admin)
 */
export const deactivatePromo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { promoId } = req.params;
    if (!Types.ObjectId.isValid(promoId)) {
      sendBadRequest(res, 'Invalid promo ID', 'معرف الكود غير صالح');
      return;
    }

    const promo = await promoService.deactivatePromoCode(new Types.ObjectId(promoId));

    sendSuccess(res, { promo }, 'Promo code deactivated', 'تم إلغاء تفعيل كود الخصم');
  } catch (error: any) {
    logger.error(`Deactivate promo error: ${error.message}`);
    sendBadRequest(res, error.message, error.message);
  }
};

/**
 * Get all promo codes (Admin)
 */
export const getAllPromos = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const active = req.query.active !== undefined
      ? req.query.active === 'true'
      : undefined;

    const result = await promoService.getAllPromoCodes({ page, limit, active });

    sendSuccess(res, result, 'Promo codes retrieved', 'تم استرجاع أكواد الخصم');
  } catch (error: any) {
    logger.error(`Get all promos error: ${error.message}`);
    sendError(res, 'Failed to get promo codes', 'فشل استرجاع أكواد الخصم');
  }
};

/**
 * Get promo code by ID (Admin)
 */
export const getPromoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { promoId } = req.params;
    if (!Types.ObjectId.isValid(promoId)) {
      sendBadRequest(res, 'Invalid promo ID', 'معرف الكود غير صالح');
      return;
    }

    const promo = await promoService.getPromoCodeById(new Types.ObjectId(promoId));

    if (!promo) {
      sendNotFound(res, 'Promo code not found', 'لم يتم العثور على كود الخصم');
      return;
    }

    sendSuccess(res, { promo }, 'Promo code retrieved', 'تم استرجاع كود الخصم');
  } catch (error: any) {
    logger.error(`Get promo error: ${error.message}`);
    sendError(res, 'Failed to get promo code', 'فشل استرجاع كود الخصم');
  }
};

/**
 * Get promo stats (Admin)
 */
export const getPromoStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { promoId } = req.params;
    if (!Types.ObjectId.isValid(promoId)) {
      sendBadRequest(res, 'Invalid promo ID', 'معرف الكود غير صالح');
      return;
    }

    const stats = await promoService.getPromoStats(new Types.ObjectId(promoId));

    sendSuccess(res, { stats }, 'Stats retrieved', 'تم استرجاع الإحصائيات');
  } catch (error: any) {
    logger.error(`Get promo stats error: ${error.message}`);
    sendError(res, 'Failed to get stats', 'فشل استرجاع الإحصائيات');
  }
};

export default {
  validatePromo,
  getAvailablePromos,
  getPromoHistory,
  createPromo,
  updatePromo,
  deactivatePromo,
  getAllPromos,
  getPromoById,
  getPromoStats,
};
