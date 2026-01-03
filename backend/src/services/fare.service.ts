import { Types } from 'mongoose';
import FareSetting, { IFareSetting } from '../models/FareSetting';
import PromoCode from '../models/PromoCode';
import { config } from '../config';
import { logger } from '../utils/logger';
import { calculateRoute, Coordinates } from './maps.service';
import { RideCategory } from '../types';

// Ride type including all vehicle types
export type RideType = RideCategory | 'tuktuk' | 'motorcycle';

// Fare breakdown interface
export interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  waitingFare: number;
  surgeMultiplier: number;
  surgeAmount: number;
  bookingFee: number;
  tolls: number;
  discount: number;
  promoCode?: string;
  subtotal: number;
  total: number;
  driverEarnings: number;
  platformEarnings: number;
}

// Fare estimate interface
export interface FareEstimate {
  rideType: RideType;
  min: number;
  max: number;
  currency: string;
  distance: number;
  duration: number;
  distanceText: string;
  durationText: string;
  surgeMultiplier: number;
  isSurge: boolean;
}

// All ride type estimates
export interface AllFareEstimates {
  distance: number;
  duration: number;
  distanceText: string;
  durationText: string;
  estimates: FareEstimate[];
}

// Promo validation result
export interface PromoValidation {
  valid: boolean;
  message: string;
  messageAr: string;
  discount?: number;
  promoCode?: string;
}

/**
 * Initialize default fare settings if not exist
 */
export const initializeFareSettings = async (): Promise<void> => {
  try {
    await FareSetting.initializeDefaults();
    logger.info('Fare settings initialized');
  } catch (error) {
    logger.error(`Failed to initialize fare settings: ${error}`);
  }
};

/**
 * Get fare settings for a specific ride type
 */
export const getFareSettings = async (rideType: RideType): Promise<IFareSetting | null> => {
  try {
    const settings = await FareSetting.getByRideType(rideType);
    return settings;
  } catch (error) {
    logger.error(`Failed to get fare settings for ${rideType}: ${error}`);
    return null;
  }
};

/**
 * Get all active fare settings
 */
export const getAllFareSettings = async (): Promise<IFareSetting[]> => {
  try {
    const settings = await FareSetting.find({ isActive: true });
    return settings;
  } catch (error) {
    logger.error(`Failed to get all fare settings: ${error}`);
    return [];
  }
};

/**
 * Get current surge multiplier for a ride type
 */
export const getCurrentSurgeMultiplier = async (rideType: RideType): Promise<number> => {
  try {
    return await FareSetting.getCurrentSurgeMultiplier(rideType);
  } catch (error) {
    logger.error(`Failed to get surge multiplier: ${error}`);
    return 1;
  }
};

/**
 * Calculate Haversine distance in km
 */
const calculateHaversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Format distance to text
 */
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} متر`;
  }
  return `${(meters / 1000).toFixed(1)} كم`;
};

/**
 * Format duration to text
 */
const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} دقيقة`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} ساعة`;
  }
  return `${hours} ساعة و ${remainingMinutes} دقيقة`;
};

/**
 * Calculate fare estimate for a single ride type
 */
export const calculateFareEstimate = async (
  origin: Coordinates,
  destination: Coordinates,
  rideType: RideType
): Promise<FareEstimate | null> => {
  try {
    // Get fare settings
    const fareSettings = await getFareSettings(rideType);
    if (!fareSettings) {
      logger.warn(`No fare settings found for ${rideType}`);
      return null;
    }

    // Get route info
    let distance: number;
    let duration: number;
    let distanceText: string;
    let durationText: string;

    const route = await calculateRoute(origin, destination);
    if (route) {
      distance = route.distance;
      duration = route.duration;
      distanceText = route.distanceText;
      durationText = route.durationText;
    } else {
      // Fallback to Haversine distance
      const distanceKm = calculateHaversineDistance(
        origin.lat,
        origin.lng,
        destination.lat,
        destination.lng
      );
      distance = distanceKm * 1000; // Convert to meters
      duration = Math.round((distanceKm / 30) * 3600); // Assume 30 km/h average
      distanceText = formatDistance(distance);
      durationText = formatDuration(duration);
    }

    // Get surge multiplier
    const surgeMultiplier = await getCurrentSurgeMultiplier(rideType);
    const isSurge = surgeMultiplier > 1;

    // Calculate fare
    const distanceKm = distance / 1000;
    const durationMinutes = duration / 60;

    const baseFare = fareSettings.baseFare;
    const distanceFare = distanceKm * fareSettings.perKm;
    const timeFare = durationMinutes * fareSettings.perMinute;
    const bookingFee = fareSettings.bookingFee;

    let subtotal = baseFare + distanceFare + timeFare;

    // Apply surge
    if (isSurge) {
      subtotal *= surgeMultiplier;
    }

    // Add booking fee and ensure minimum fare
    const total = Math.max(subtotal + bookingFee, fareSettings.minimumFare);

    // Calculate range (±10%)
    const min = Math.round(total * 0.9);
    const max = Math.round(total * 1.1);

    return {
      rideType,
      min,
      max,
      currency: 'EGP',
      distance,
      duration,
      distanceText,
      durationText,
      surgeMultiplier,
      isSurge,
    };
  } catch (error) {
    logger.error(`Failed to calculate fare estimate: ${error}`);
    return null;
  }
};

/**
 * Calculate fare estimates for all ride types
 */
export const calculateAllFareEstimates = async (
  origin: Coordinates,
  destination: Coordinates
): Promise<AllFareEstimates | null> => {
  try {
    // Get route info first (single API call)
    let distance: number;
    let duration: number;
    let distanceText: string;
    let durationText: string;

    const route = await calculateRoute(origin, destination);
    if (route) {
      distance = route.distance;
      duration = route.duration;
      distanceText = route.distanceText;
      durationText = route.durationText;
    } else {
      // Fallback to Haversine distance
      const distanceKm = calculateHaversineDistance(
        origin.lat,
        origin.lng,
        destination.lat,
        destination.lng
      );
      distance = distanceKm * 1000;
      duration = Math.round((distanceKm / 30) * 3600);
      distanceText = formatDistance(distance);
      durationText = formatDuration(duration);
    }

    // Get all fare settings
    const allSettings = await getAllFareSettings();
    if (allSettings.length === 0) {
      logger.warn('No fare settings found');
      return null;
    }

    // Calculate estimates for each ride type
    const distanceKm = distance / 1000;
    const durationMinutes = duration / 60;

    const estimates: FareEstimate[] = [];

    for (const settings of allSettings) {
      const surgeMultiplier = await getCurrentSurgeMultiplier(settings.rideType as RideType);
      const isSurge = surgeMultiplier > 1;

      const baseFare = settings.baseFare;
      const distanceFare = distanceKm * settings.perKm;
      const timeFare = durationMinutes * settings.perMinute;
      const bookingFee = settings.bookingFee;

      let subtotal = baseFare + distanceFare + timeFare;

      if (isSurge) {
        subtotal *= surgeMultiplier;
      }

      const total = Math.max(subtotal + bookingFee, settings.minimumFare);

      estimates.push({
        rideType: settings.rideType as RideType,
        min: Math.round(total * 0.9),
        max: Math.round(total * 1.1),
        currency: 'EGP',
        distance,
        duration,
        distanceText,
        durationText,
        surgeMultiplier,
        isSurge,
      });
    }

    // Sort by min price
    estimates.sort((a, b) => a.min - b.min);

    return {
      distance,
      duration,
      distanceText,
      durationText,
      estimates,
    };
  } catch (error) {
    logger.error(`Failed to calculate all fare estimates: ${error}`);
    return null;
  }
};

/**
 * Calculate final fare for a completed trip
 */
export const calculateFinalFare = async (
  rideType: RideType,
  distanceMeters: number,
  durationSeconds: number,
  waitingTimeSeconds: number = 0,
  promoCode?: string,
  userId?: Types.ObjectId
): Promise<FareBreakdown | null> => {
  try {
    // Get fare settings
    const fareSettings = await getFareSettings(rideType);
    if (!fareSettings) {
      logger.warn(`No fare settings found for ${rideType}`);
      return null;
    }

    const distanceKm = distanceMeters / 1000;
    const durationMinutes = durationSeconds / 60;
    const waitingMinutes = waitingTimeSeconds / 60;

    // Calculate base components
    const baseFare = fareSettings.baseFare;
    const distanceFare = distanceKm * fareSettings.perKm;
    const timeFare = durationMinutes * fareSettings.perMinute;
    const bookingFee = fareSettings.bookingFee;

    // Calculate waiting fare
    let waitingFare = 0;
    if (waitingMinutes > fareSettings.waitingFare.freeMinutes) {
      const chargeableMinutes = waitingMinutes - fareSettings.waitingFare.freeMinutes;
      waitingFare = chargeableMinutes * fareSettings.waitingFare.perMinute;
    }

    // Get surge multiplier
    const surgeMultiplier = await getCurrentSurgeMultiplier(rideType);

    // Calculate subtotal before surge
    let subtotal = baseFare + distanceFare + timeFare + waitingFare;

    // Apply surge
    let surgeAmount = 0;
    if (surgeMultiplier > 1) {
      surgeAmount = subtotal * (surgeMultiplier - 1);
      subtotal *= surgeMultiplier;
    }

    // Apply promo code if provided
    let discount = 0;
    let appliedPromoCode: string | undefined;

    if (promoCode && userId) {
      const promoValidation = await validatePromoCode(
        promoCode,
        userId,
        subtotal + bookingFee,
        rideType,
        false // isNewUser - should be passed from user data
      );

      if (promoValidation.valid && promoValidation.discount) {
        discount = promoValidation.discount;
        appliedPromoCode = promoCode;
      }
    }

    // Calculate final total
    const total = Math.max(subtotal + bookingFee - discount, fareSettings.minimumFare);

    // Calculate earnings split
    const commissionRate = config.app.defaultCommission / 100;
    const platformEarnings = (total - bookingFee) * commissionRate + bookingFee;
    const driverEarnings = total - platformEarnings;

    return {
      baseFare: Math.round(baseFare * 100) / 100,
      distanceFare: Math.round(distanceFare * 100) / 100,
      timeFare: Math.round(timeFare * 100) / 100,
      waitingFare: Math.round(waitingFare * 100) / 100,
      surgeMultiplier,
      surgeAmount: Math.round(surgeAmount * 100) / 100,
      bookingFee,
      tolls: 0, // Can be added later
      discount: Math.round(discount * 100) / 100,
      promoCode: appliedPromoCode,
      subtotal: Math.round(subtotal * 100) / 100,
      total: Math.round(total * 100) / 100,
      driverEarnings: Math.round(driverEarnings * 100) / 100,
      platformEarnings: Math.round(platformEarnings * 100) / 100,
    };
  } catch (error) {
    logger.error(`Failed to calculate final fare: ${error}`);
    return null;
  }
};

/**
 * Validate promo code for a user and fare
 */
export const validatePromoCode = async (
  code: string,
  userId: Types.ObjectId,
  fare: number,
  rideType: RideType,
  isNewUser: boolean
): Promise<PromoValidation> => {
  try {
    const result = await PromoCode.validateForUser(
      code,
      userId,
      fare,
      rideType,
      isNewUser
    );

    return {
      valid: result.valid,
      message: result.message,
      messageAr: result.messageAr,
      discount: result.discount,
      promoCode: result.valid ? code.toUpperCase() : undefined,
    };
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
 * Apply promo code after trip completion
 */
export const applyPromoCode = async (
  code: string,
  userId: Types.ObjectId,
  tripId: Types.ObjectId,
  discount: number
): Promise<void> => {
  try {
    await PromoCode.usePromo(code, userId, tripId, discount);
    logger.info(`Promo code ${code} applied for trip ${tripId}`);
  } catch (error) {
    logger.error(`Failed to apply promo code: ${error}`);
  }
};

/**
 * Calculate cancellation fee
 */
export const calculateCancellationFee = async (
  tripCreatedAt: Date,
  driverAssignedAt?: Date,
  rideType?: RideType
): Promise<number> => {
  const now = new Date();
  const freeCancellationMs = config.app.freeCancellationMinutes * 60 * 1000;
  const defaultFee = config.app.cancellationFee;

  // Free cancellation within time limit
  const tripAgeMs = now.getTime() - tripCreatedAt.getTime();
  if (tripAgeMs <= freeCancellationMs && !driverAssignedAt) {
    return 0;
  }

  // Get ride-specific cancellation fee if available
  if (rideType) {
    const settings = await getFareSettings(rideType);
    if (settings) {
      // Can add cancellation fee to FareSetting model
      // For now, return default
    }
  }

  return defaultFee;
};

/**
 * Get fare breakdown for display
 */
export const getFareBreakdownForDisplay = (fare: FareBreakdown): {
  items: Array<{ label: string; labelAr: string; amount: number }>;
  total: number;
} => {
  const items: Array<{ label: string; labelAr: string; amount: number }> = [];

  items.push({
    label: 'Base Fare',
    labelAr: 'أجرة البداية',
    amount: fare.baseFare,
  });

  items.push({
    label: 'Distance Fare',
    labelAr: 'أجرة المسافة',
    amount: fare.distanceFare,
  });

  items.push({
    label: 'Time Fare',
    labelAr: 'أجرة الوقت',
    amount: fare.timeFare,
  });

  if (fare.waitingFare > 0) {
    items.push({
      label: 'Waiting Fare',
      labelAr: 'أجرة الانتظار',
      amount: fare.waitingFare,
    });
  }

  if (fare.surgeAmount > 0) {
    items.push({
      label: `Surge (${fare.surgeMultiplier}x)`,
      labelAr: `زيادة الطلب (${fare.surgeMultiplier}x)`,
      amount: fare.surgeAmount,
    });
  }

  items.push({
    label: 'Booking Fee',
    labelAr: 'رسوم الحجز',
    amount: fare.bookingFee,
  });

  if (fare.tolls > 0) {
    items.push({
      label: 'Tolls',
      labelAr: 'رسوم الطريق',
      amount: fare.tolls,
    });
  }

  if (fare.discount > 0) {
    items.push({
      label: fare.promoCode ? `Discount (${fare.promoCode})` : 'Discount',
      labelAr: fare.promoCode ? `خصم (${fare.promoCode})` : 'خصم',
      amount: -fare.discount,
    });
  }

  return {
    items,
    total: fare.total,
  };
};

/**
 * Update fare settings (admin only)
 */
export const updateFareSettings = async (
  rideType: RideType,
  updates: Partial<IFareSetting>,
  updatedBy: Types.ObjectId
): Promise<IFareSetting | null> => {
  try {
    const settings = await FareSetting.findOneAndUpdate(
      { rideType },
      { ...updates, updatedBy },
      { new: true, runValidators: true }
    );

    if (settings) {
      logger.info(`Fare settings updated for ${rideType} by ${updatedBy}`);
    }

    return settings;
  } catch (error) {
    logger.error(`Failed to update fare settings: ${error}`);
    return null;
  }
};

export default {
  initializeFareSettings,
  getFareSettings,
  getAllFareSettings,
  getCurrentSurgeMultiplier,
  calculateFareEstimate,
  calculateAllFareEstimates,
  calculateFinalFare,
  validatePromoCode,
  applyPromoCode,
  calculateCancellationFee,
  getFareBreakdownForDisplay,
  updateFareSettings,
};
