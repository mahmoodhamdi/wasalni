import { Types, FilterQuery } from 'mongoose';
import PromoCode, { IPromoCode } from '../models/PromoCode';
import Trip from '../models/Trip';
import Passenger from '../models/Passenger';
import { logger } from '../utils/logger';
import { PromoType } from '../types';

// Promo Code Request
export interface CreatePromoRequest {
  code: string;
  type: PromoType;
  value: number;
  maxDiscount?: number;
  minFare?: number;
  usageLimit?: number;
  perUserLimit?: number;
  validFrom: Date;
  validUntil: Date;
  rideTypes?: string[];
  newUsersOnly?: boolean;
  userIds?: Types.ObjectId[];
  createdBy?: Types.ObjectId;
}

// Promo Validation Result
export interface PromoValidationResult {
  valid: boolean;
  message: string;
  messageAr: string;
  promo?: IPromoCode;
  discount?: number;
  discountType?: PromoType;
}

// User Promo Info
export interface UserPromoInfo {
  code: string;
  type: PromoType;
  value: number;
  maxDiscount?: number;
  minFare?: number;
  validUntil: Date;
  rideTypes: string[];
  remainingUses: number;
  description: string;
  descriptionAr: string;
}

/**
 * Validate promo code for a user and trip
 */
export const validatePromoCode = async (
  code: string,
  userId: Types.ObjectId,
  fare: number,
  rideType: string
): Promise<PromoValidationResult> => {
  try {
    // Check if user is new (no completed trips)
    const passenger = await Passenger.findOne({ userId });
    if (!passenger) {
      return {
        valid: false,
        message: 'Passenger not found',
        messageAr: 'لم يتم العثور على الراكب',
      };
    }

    const completedTrips = await Trip.countDocuments({
      passengerId: passenger._id,
      status: 'trip_completed',
    });
    const isNewUser = completedTrips === 0;

    // Use model's validation method
    const result = await PromoCode.validateForUser(
      code,
      userId,
      fare,
      rideType,
      isNewUser
    );

    if (result.valid) {
      const promo = await PromoCode.findOne({ code: code.toUpperCase() });
      return {
        ...result,
        promo: promo!,
        discountType: promo!.type,
      };
    }

    return result;
  } catch (error) {
    logger.error(`Failed to validate promo code: ${error}`);
    return {
      valid: false,
      message: 'Failed to validate promo code',
      messageAr: 'فشل التحقق من كود الخصم',
    };
  }
};

/**
 * Apply promo code to a trip
 */
export const applyPromoToTrip = async (
  code: string,
  userId: Types.ObjectId,
  tripId: Types.ObjectId,
  fare: number,
  rideType: string
): Promise<{ success: boolean; discount: number; message: string; messageAr: string }> => {
  try {
    // Validate first
    const validation = await validatePromoCode(code, userId, fare, rideType);
    if (!validation.valid) {
      return {
        success: false,
        discount: 0,
        message: validation.message,
        messageAr: validation.messageAr,
      };
    }

    // Apply the promo
    await PromoCode.usePromo(code, userId, tripId, validation.discount!);

    // Update trip with promo info
    await Trip.findByIdAndUpdate(tripId, {
      'fare.promoCode': code.toUpperCase(),
      'fare.discount': validation.discount,
    });

    return {
      success: true,
      discount: validation.discount!,
      message: 'Promo code applied successfully',
      messageAr: 'تم تطبيق كود الخصم بنجاح',
    };
  } catch (error) {
    logger.error(`Failed to apply promo code: ${error}`);
    return {
      success: false,
      discount: 0,
      message: 'Failed to apply promo code',
      messageAr: 'فشل تطبيق كود الخصم',
    };
  }
};

/**
 * Get available promo codes for a user
 */
export const getAvailablePromos = async (
  userId: Types.ObjectId,
  options: { rideType?: string; fare?: number } = {}
): Promise<UserPromoInfo[]> => {
  try {
    const now = new Date();

    // Find all active promos
    const query: FilterQuery<IPromoCode> = {
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { usageLimit: null },
        { usageLimit: { $exists: false } },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
      ],
    };

    // Filter by ride type if provided
    if (options.rideType) {
      query.$or = [
        { rideTypes: { $size: 0 } },
        { rideTypes: options.rideType },
      ];
    }

    const promos = await PromoCode.find(query);

    // Get user's usage for each promo
    const PromoUsage = (await import('mongoose')).default.model('PromoUsage');
    const userUsages = await PromoUsage.find({ userId });
    const usageMap = new Map<string, number>();
    userUsages.forEach((usage: any) => {
      const id = usage.promoCodeId.toString();
      usageMap.set(id, (usageMap.get(id) || 0) + 1);
    });

    // Check if user is new
    const passenger = await Passenger.findOne({ userId });
    const completedTrips = passenger
      ? await Trip.countDocuments({
          passengerId: passenger._id,
          status: 'trip_completed',
        })
      : 0;
    const isNewUser = completedTrips === 0;

    // Filter and format promos
    const availablePromos: UserPromoInfo[] = [];

    for (const promo of promos) {
      // Check new users only
      if (promo.newUsersOnly && !isNewUser) continue;

      // Check specific users
      if (promo.userIds.length > 0 && !promo.userIds.some((id) => id.equals(userId))) {
        continue;
      }

      // Check per user limit
      const userUsage = usageMap.get(promo._id.toString()) || 0;
      if (userUsage >= promo.perUserLimit) continue;

      // Check minimum fare
      if (options.fare && promo.minFare && options.fare < promo.minFare) continue;

      // Build description
      let description = '';
      let descriptionAr = '';

      if (promo.type === 'percentage') {
        description = `${promo.value}% off`;
        descriptionAr = `خصم ${promo.value}%`;
        if (promo.maxDiscount) {
          description += ` (max ${promo.maxDiscount} EGP)`;
          descriptionAr += ` (حد أقصى ${promo.maxDiscount} ج.م)`;
        }
      } else {
        description = `${promo.value} EGP off`;
        descriptionAr = `خصم ${promo.value} ج.م`;
      }

      if (promo.minFare) {
        description += ` on fares over ${promo.minFare} EGP`;
        descriptionAr += ` للرحلات أكثر من ${promo.minFare} ج.م`;
      }

      availablePromos.push({
        code: promo.code,
        type: promo.type,
        value: promo.value,
        maxDiscount: promo.maxDiscount,
        minFare: promo.minFare,
        validUntil: promo.validUntil,
        rideTypes: promo.rideTypes,
        remainingUses: promo.perUserLimit - userUsage,
        description,
        descriptionAr,
      });
    }

    return availablePromos;
  } catch (error) {
    logger.error(`Failed to get available promos: ${error}`);
    return [];
  }
};

/**
 * Get user's promo usage history
 */
export const getPromoUsageHistory = async (
  userId: Types.ObjectId,
  options: { page?: number; limit?: number } = {}
): Promise<{
  usages: Array<{
    code: string;
    discount: number;
    tripNumber: string;
    usedAt: Date;
  }>;
  total: number;
  hasMore: boolean;
}> => {
  try {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const PromoUsage = (await import('mongoose')).default.model('PromoUsage');

    const [usages, total] = await Promise.all([
      PromoUsage.find({ userId })
        .populate('promoCodeId', 'code')
        .populate('tripId', 'tripNumber')
        .sort({ usedAt: -1 })
        .skip(skip)
        .limit(limit),
      PromoUsage.countDocuments({ userId }),
    ]);

    const formattedUsages = usages.map((usage: any) => ({
      code: usage.promoCodeId?.code || 'Unknown',
      discount: usage.discount,
      tripNumber: usage.tripId?.tripNumber || 'Unknown',
      usedAt: usage.usedAt,
    }));

    return {
      usages: formattedUsages,
      total,
      hasMore: skip + usages.length < total,
    };
  } catch (error) {
    logger.error(`Failed to get promo usage history: ${error}`);
    return { usages: [], total: 0, hasMore: false };
  }
};

/**
 * Create a new promo code (Admin)
 */
export const createPromoCode = async (
  request: CreatePromoRequest
): Promise<IPromoCode> => {
  try {
    // Check if code already exists
    const existing = await PromoCode.findOne({ code: request.code.toUpperCase() });
    if (existing) {
      throw new Error('Promo code already exists');
    }

    const promo = await PromoCode.create({
      code: request.code.toUpperCase(),
      type: request.type,
      value: request.value,
      maxDiscount: request.maxDiscount,
      minFare: request.minFare,
      usageLimit: request.usageLimit,
      perUserLimit: request.perUserLimit || 1,
      validFrom: request.validFrom,
      validUntil: request.validUntil,
      rideTypes: request.rideTypes || [],
      newUsersOnly: request.newUsersOnly || false,
      userIds: request.userIds || [],
      createdBy: request.createdBy,
    });

    logger.info(`Promo code ${promo.code} created`);
    return promo;
  } catch (error) {
    logger.error(`Failed to create promo code: ${error}`);
    throw error;
  }
};

/**
 * Update promo code (Admin)
 */
export const updatePromoCode = async (
  promoId: Types.ObjectId,
  updates: Partial<CreatePromoRequest>
): Promise<IPromoCode> => {
  try {
    const promo = await PromoCode.findById(promoId);
    if (!promo) {
      throw new Error('Promo code not found');
    }

    // Don't allow changing code if it has been used
    if (updates.code && promo.usedCount > 0) {
      throw new Error('Cannot change code of used promo');
    }

    const updateData: any = { ...updates };
    if (updates.code) {
      updateData.code = updates.code.toUpperCase();
    }

    const updated = await PromoCode.findByIdAndUpdate(promoId, updateData, {
      new: true,
    });

    logger.info(`Promo code ${promo.code} updated`);
    return updated!;
  } catch (error) {
    logger.error(`Failed to update promo code: ${error}`);
    throw error;
  }
};

/**
 * Deactivate promo code (Admin)
 */
export const deactivatePromoCode = async (
  promoId: Types.ObjectId
): Promise<IPromoCode> => {
  try {
    const promo = await PromoCode.findByIdAndUpdate(
      promoId,
      { isActive: false },
      { new: true }
    );

    if (!promo) {
      throw new Error('Promo code not found');
    }

    logger.info(`Promo code ${promo.code} deactivated`);
    return promo;
  } catch (error) {
    logger.error(`Failed to deactivate promo code: ${error}`);
    throw error;
  }
};

/**
 * Get all promo codes (Admin)
 */
export const getAllPromoCodes = async (
  options: { page?: number; limit?: number; active?: boolean } = {}
): Promise<{
  promos: IPromoCode[];
  total: number;
  hasMore: boolean;
}> => {
  try {
    const { page = 1, limit = 20, active } = options;
    const skip = (page - 1) * limit;

    const query: FilterQuery<IPromoCode> = {};
    if (active !== undefined) {
      query.isActive = active;
    }

    const [promos, total] = await Promise.all([
      PromoCode.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PromoCode.countDocuments(query),
    ]);

    return {
      promos,
      total,
      hasMore: skip + promos.length < total,
    };
  } catch (error) {
    logger.error(`Failed to get promo codes: ${error}`);
    return { promos: [], total: 0, hasMore: false };
  }
};

/**
 * Get promo code by ID (Admin)
 */
export const getPromoCodeById = async (
  promoId: Types.ObjectId
): Promise<IPromoCode | null> => {
  try {
    return await PromoCode.findById(promoId);
  } catch (error) {
    logger.error(`Failed to get promo code: ${error}`);
    throw error;
  }
};

/**
 * Get promo code stats (Admin)
 */
export const getPromoStats = async (
  promoId: Types.ObjectId
): Promise<{
  totalUsage: number;
  totalDiscount: number;
  uniqueUsers: number;
  usageByDay: Array<{ date: string; count: number; discount: number }>;
}> => {
  try {
    const PromoUsage = (await import('mongoose')).default.model('PromoUsage');

    const [totalStats, usageByDay, uniqueUsers] = await Promise.all([
      PromoUsage.aggregate([
        { $match: { promoCodeId: promoId } },
        {
          $group: {
            _id: null,
            totalUsage: { $sum: 1 },
            totalDiscount: { $sum: '$discount' },
          },
        },
      ]),
      PromoUsage.aggregate([
        { $match: { promoCodeId: promoId } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$usedAt' } },
            count: { $sum: 1 },
            discount: { $sum: '$discount' },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ]),
      PromoUsage.distinct('userId', { promoCodeId: promoId }),
    ]);

    return {
      totalUsage: totalStats[0]?.totalUsage || 0,
      totalDiscount: totalStats[0]?.totalDiscount || 0,
      uniqueUsers: uniqueUsers.length,
      usageByDay: usageByDay.map((day: any) => ({
        date: day._id,
        count: day.count,
        discount: day.discount,
      })),
    };
  } catch (error) {
    logger.error(`Failed to get promo stats: ${error}`);
    return { totalUsage: 0, totalDiscount: 0, uniqueUsers: 0, usageByDay: [] };
  }
};

export default {
  validatePromoCode,
  applyPromoToTrip,
  getAvailablePromos,
  getPromoUsageHistory,
  createPromoCode,
  updatePromoCode,
  deactivatePromoCode,
  getAllPromoCodes,
  getPromoCodeById,
  getPromoStats,
};
