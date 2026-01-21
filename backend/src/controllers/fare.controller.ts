import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import fareService, { RideType } from '../services/fare.service';
import { successResponse, errorResponse } from '../utils/response';
import { Types } from 'mongoose';

/**
 * Get fare estimate for a trip
 * POST /api/v1/fare/estimate
 */
export const getFareEstimate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse(
          'Validation failed',
          'فشل التحقق من البيانات',
          errors.array()
        )
      );
      return;
    }

    const { origin, destination, rideType } = req.body;

    // If specific ride type requested
    if (rideType) {
      const estimate = await fareService.calculateFareEstimate(
        origin,
        destination,
        rideType as RideType
      );

      if (!estimate) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
          errorResponse(
            'Failed to calculate fare estimate',
            'فشل في حساب تقدير الأجرة'
          )
        );
        return;
      }

      res.status(StatusCodes.OK).json(
        successResponse(estimate, 'Fare estimate calculated', 'تم حساب تقدير الأجرة')
      );
      return;
    }

    // Get estimates for all ride types
    const estimates = await fareService.calculateAllFareEstimates(origin, destination);

    if (!estimates) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        errorResponse(
          'Failed to calculate fare estimates',
          'فشل في حساب تقديرات الأجرة'
        )
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      successResponse(estimates, 'Fare estimates calculated', 'تم حساب تقديرات الأجرة')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate final fare for a trip
 * POST /api/v1/fare/calculate
 */
export const calculateFare = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse(
          'Validation failed',
          'فشل التحقق من البيانات',
          errors.array()
        )
      );
      return;
    }

    const { rideType, distance, duration, waitingTime, promoCode } = req.body;
    const userId = req.user?.userId;

    const fare = await fareService.calculateFinalFare(
      rideType as RideType,
      distance,
      duration,
      waitingTime || 0,
      promoCode,
      userId ? new Types.ObjectId(userId) : undefined
    );

    if (!fare) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        errorResponse('Failed to calculate fare', 'فشل في حساب الأجرة')
      );
      return;
    }

    // Get display breakdown
    const breakdown = fareService.getFareBreakdownForDisplay(fare);

    res.status(StatusCodes.OK).json(
      successResponse(
        { fare, breakdown },
        'Fare calculated',
        'تم حساب الأجرة'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Validate promo code
 * POST /api/v1/promo/validate
 */
export const validatePromoCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse(
          'Validation failed',
          'فشل التحقق من البيانات',
          errors.array()
        )
      );
      return;
    }

    const { code, fare, rideType } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json(
        errorResponse('User not authenticated', 'المستخدم غير مسجل الدخول')
      );
      return;
    }

    // Check if user is new (0 trips)
    const isNewUser = false; // TODO: Get from passenger data

    const result = await fareService.validatePromoCode(
      code,
      new Types.ObjectId(userId),
      fare,
      rideType as RideType,
      isNewUser
    );

    if (!result.valid) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse(result.message, result.messageAr)
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      successResponse(
        { discount: result.discount, code: result.promoCode },
        result.message,
        result.messageAr
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get fare settings (public)
 * GET /api/v1/fare/settings
 */
export const getFareSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { rideType } = req.query;

    if (rideType) {
      const settings = await fareService.getFareSettings(rideType as RideType);
      if (!settings) {
        res.status(StatusCodes.NOT_FOUND).json(
          errorResponse(
            'Fare settings not found',
            'إعدادات الأجرة غير موجودة'
          )
        );
        return;
      }

      res.status(StatusCodes.OK).json(
        successResponse(settings, 'Fare settings retrieved', 'تم استرجاع إعدادات الأجرة')
      );
      return;
    }

    const allSettings = await fareService.getAllFareSettings();
    res.status(StatusCodes.OK).json(
      successResponse(allSettings, 'All fare settings retrieved', 'تم استرجاع جميع إعدادات الأجرة')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update fare settings (admin only)
 * PUT /api/v1/fare/settings/:rideType
 */
export const updateFareSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse(
          'Validation failed',
          'فشل التحقق من البيانات',
          errors.array()
        )
      );
      return;
    }

    const { rideType } = req.params;
    const adminId = req.user?.userId;

    if (!adminId) {
      res.status(StatusCodes.UNAUTHORIZED).json(
        errorResponse('Admin not authenticated', 'المدير غير مسجل الدخول')
      );
      return;
    }

    const validRideTypes = ['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'];
    if (!validRideTypes.includes(rideType)) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse('Invalid ride type', 'نوع الرحلة غير صالح')
      );
      return;
    }

    const settings = await fareService.updateFareSettings(
      rideType as RideType,
      req.body,
      new Types.ObjectId(adminId)
    );

    if (!settings) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        errorResponse(
          'Failed to update fare settings',
          'فشل في تحديث إعدادات الأجرة'
        )
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      successResponse(settings, 'Fare settings updated', 'تم تحديث إعدادات الأجرة')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get surge info
 * GET /api/v1/fare/surge
 */
export const getSurgeInfo = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const allSettings = await fareService.getAllFareSettings();

    const surgeInfo = await Promise.all(
      allSettings.map(async (settings) => {
        const multiplier = await fareService.getCurrentSurgeMultiplier(
          settings.rideType as RideType
        );
        return {
          rideType: settings.rideType,
          multiplier,
          isActive: multiplier > 1,
        };
      })
    );

    res.status(StatusCodes.OK).json(
      successResponse(surgeInfo, 'Surge info retrieved', 'تم استرجاع معلومات زيادة الطلب')
    );
  } catch (error) {
    next(error);
  }
};

export default {
  getFareEstimate,
  calculateFare,
  validatePromoCode,
  getFareSettings,
  updateFareSettings,
  getSurgeInfo,
};
