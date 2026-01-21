import { Types, FilterQuery } from 'mongoose';
import Trip, { ITrip } from '../models/Trip';
import { logger } from '../utils/logger';
import { TripStatus, PaymentMethod } from '../types';
import tripService, { TripLocation, CreateTripRequest } from './trip.service';
import { RideType } from './fare.service';

// Scheduled Trip Request
export interface ScheduledTripRequest {
  passengerId: Types.ObjectId;
  pickup: TripLocation;
  dropoff: TripLocation;
  stops?: TripLocation[];
  rideType: RideType;
  scheduledTime: Date;
  paymentMethod?: PaymentMethod;
  promoCode?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringDays?: number[]; // 0-6 (Sunday-Saturday)
}

// Scheduled Trip Info
export interface ScheduledTripInfo {
  tripId: Types.ObjectId;
  tripNumber: string;
  pickup: TripLocation;
  dropoff: TripLocation;
  scheduledTime: Date;
  rideType: string;
  estimatedFare: number;
  status: 'upcoming' | 'searching' | 'assigned' | 'cancelled';
  driverInfo?: {
    name: string;
    phone: string;
    vehicle: string;
    plateNumber: string;
  };
}

// Minimum advance booking time in minutes
const MIN_ADVANCE_BOOKING = 30;
const MAX_ADVANCE_BOOKING_DAYS = 7;

/**
 * Validate scheduled time
 */
const validateScheduledTime = (scheduledTime: Date): { valid: boolean; error?: string } => {
  const now = new Date();
  const minTime = new Date(now.getTime() + MIN_ADVANCE_BOOKING * 60 * 1000);
  const maxTime = new Date(now.getTime() + MAX_ADVANCE_BOOKING_DAYS * 24 * 60 * 60 * 1000);

  if (scheduledTime < minTime) {
    return {
      valid: false,
      error: `Scheduled time must be at least ${MIN_ADVANCE_BOOKING} minutes in the future`,
    };
  }

  if (scheduledTime > maxTime) {
    return {
      valid: false,
      error: `Cannot schedule more than ${MAX_ADVANCE_BOOKING_DAYS} days in advance`,
    };
  }

  return { valid: true };
};

/**
 * Create a scheduled trip
 */
export const createScheduledTrip = async (
  request: ScheduledTripRequest
): Promise<ITrip> => {
  try {
    // Validate scheduled time
    const validation = validateScheduledTime(request.scheduledTime);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Create trip using existing trip service
    const createRequest: CreateTripRequest = {
      passengerId: request.passengerId,
      pickup: request.pickup,
      dropoff: request.dropoff,
      stops: request.stops,
      rideType: request.rideType,
      tripType: 'scheduled',
      paymentMethod: request.paymentMethod,
      scheduledTime: request.scheduledTime,
      promoCode: request.promoCode,
      notes: request.notes,
    };

    const trip = await tripService.createTrip(createRequest);
    if (!trip) {
      throw new Error('Failed to create scheduled trip');
    }

    logger.info(`Scheduled trip ${trip.tripNumber} created for ${request.scheduledTime}`);

    return trip;
  } catch (error) {
    logger.error(`Failed to create scheduled trip: ${error}`);
    throw error;
  }
};

/**
 * Get upcoming scheduled trips for passenger
 */
export const getUpcomingScheduledTrips = async (
  passengerId: Types.ObjectId,
  options: { page?: number; limit?: number } = {}
): Promise<{ trips: ScheduledTripInfo[]; total: number; hasMore: boolean }> => {
  try {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const query: FilterQuery<ITrip> = {
      passengerId,
      tripType: 'scheduled',
      isScheduled: true,
      scheduledTime: { $gte: new Date() },
      status: { $nin: ['trip_completed', 'cancelled'] },
    };

    const [trips, total] = await Promise.all([
      Trip.find(query)
        .sort({ scheduledTime: 1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'driverId',
          populate: { path: 'userId', select: 'name phone' },
          select: 'vehicle userId',
        }),
      Trip.countDocuments(query),
    ]);

    const formattedTrips: ScheduledTripInfo[] = trips.map((trip) => {
      const driver = trip.driverId as any;
      let status: ScheduledTripInfo['status'] = 'upcoming';

      if (trip.isCancelled) {
        status = 'cancelled';
      } else if (driver) {
        status = 'assigned';
      } else if (trip.status === 'searching') {
        status = 'searching';
      }

      return {
        tripId: trip._id,
        tripNumber: trip.tripNumber,
        pickup: {
          address: trip.pickup.address,
          latitude: trip.pickup.location.coordinates[1],
          longitude: trip.pickup.location.coordinates[0],
        },
        dropoff: {
          address: trip.dropoff.address,
          latitude: trip.dropoff.location.coordinates[1],
          longitude: trip.dropoff.location.coordinates[0],
        },
        scheduledTime: trip.scheduledTime!,
        rideType: trip.rideType,
        estimatedFare: trip.estimatedFare?.max || 0,
        status,
        driverInfo: driver
          ? {
              name: driver.userId?.name || '',
              phone: driver.userId?.phone || '',
              vehicle: `${driver.vehicle?.make} ${driver.vehicle?.model}`,
              plateNumber: driver.vehicle?.plateNumber || '',
            }
          : undefined,
      };
    });

    return {
      trips: formattedTrips,
      total,
      hasMore: skip + trips.length < total,
    };
  } catch (error) {
    logger.error(`Failed to get upcoming scheduled trips: ${error}`);
    throw error;
  }
};

/**
 * Get single scheduled trip details
 */
export const getScheduledTripDetails = async (
  tripId: Types.ObjectId,
  passengerId: Types.ObjectId
): Promise<ITrip | null> => {
  try {
    const trip = await Trip.findOne({
      _id: tripId,
      passengerId,
      isScheduled: true,
    })
      .populate({
        path: 'driverId',
        populate: { path: 'userId', select: 'name phone avatar' },
        select: 'vehicle rating userId currentLocation',
      })
      .populate({
        path: 'passengerId',
        populate: { path: 'userId', select: 'name phone avatar' },
      });

    return trip;
  } catch (error) {
    logger.error(`Failed to get scheduled trip details: ${error}`);
    throw error;
  }
};

/**
 * Modify scheduled trip time
 */
export const modifyScheduledTime = async (
  tripId: Types.ObjectId,
  passengerId: Types.ObjectId,
  newScheduledTime: Date
): Promise<ITrip> => {
  try {
    // Validate new time
    const validation = validateScheduledTime(newScheduledTime);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const trip = await Trip.findOne({
      _id: tripId,
      passengerId,
      isScheduled: true,
      status: { $in: ['searching', 'driver_assigned'] },
    });

    if (!trip) {
      throw new Error('Scheduled trip not found or cannot be modified');
    }

    // Check if driver is already assigned
    if (trip.driverId) {
      throw new Error('Cannot modify time after driver is assigned');
    }

    // Update scheduled time
    trip.scheduledTime = newScheduledTime;
    await trip.save();

    logger.info(`Scheduled trip ${trip.tripNumber} time modified to ${newScheduledTime}`);

    return trip;
  } catch (error) {
    logger.error(`Failed to modify scheduled trip time: ${error}`);
    throw error;
  }
};

/**
 * Cancel scheduled trip
 */
export const cancelScheduledTrip = async (
  tripId: Types.ObjectId,
  passengerId: Types.ObjectId,
  reason?: string
): Promise<ITrip> => {
  try {
    const trip = await Trip.findOne({
      _id: tripId,
      passengerId,
      isScheduled: true,
      status: { $nin: ['trip_completed', 'cancelled'] },
    });

    if (!trip) {
      throw new Error('Scheduled trip not found or already completed');
    }

    // Calculate cancellation fee based on time until scheduled trip
    const now = new Date();
    const scheduledTime = trip.scheduledTime!;
    const hoursUntilTrip = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let cancellationFee = 0;
    if (hoursUntilTrip < 1) {
      // Less than 1 hour - 50% of estimated fare
      cancellationFee = (trip.estimatedFare?.max || 0) * 0.5;
    } else if (hoursUntilTrip < 2) {
      // 1-2 hours - 25% of estimated fare
      cancellationFee = (trip.estimatedFare?.max || 0) * 0.25;
    }
    // More than 2 hours - no fee

    trip.isCancelled = true;
    trip.cancelledBy = 'passenger';
    trip.cancelReason = reason;
    trip.cancelledAt = new Date();
    trip.cancellationFee = cancellationFee;
    trip.status = 'cancelled' as TripStatus;

    await trip.save();

    // Notify driver if assigned
    if (trip.driverId) {
      logger.info(`Notifying driver ${trip.driverId} of cancelled scheduled trip`);
      try {
        const notificationService = await import('./notification.service');
        await notificationService.sendNotification(
          trip.driverId as Types.ObjectId,
          {
            title: 'Scheduled Trip Cancelled',
            titleAr: 'تم إلغاء الرحلة المجدولة',
            body: `The scheduled trip ${trip.tripNumber} has been cancelled by the passenger`,
            bodyAr: `تم إلغاء الرحلة المجدولة ${trip.tripNumber} من قبل الراكب`,
            type: 'trip',
            data: { tripId: trip._id.toString(), type: 'scheduled_cancelled' },
          }
        );
      } catch (notifyError) {
        logger.error(`Failed to notify driver of cancellation: ${notifyError}`);
      }
    }

    logger.info(`Scheduled trip ${trip.tripNumber} cancelled`);

    return trip;
  } catch (error) {
    logger.error(`Failed to cancel scheduled trip: ${error}`);
    throw error;
  }
};

/**
 * Get trips that need driver dispatch (called by scheduler)
 */
export const getTripsForDispatch = async (
  minutesBefore: number = 15
): Promise<ITrip[]> => {
  try {
    const now = new Date();
    const dispatchWindow = new Date(now.getTime() + minutesBefore * 60 * 1000);

    const trips = await Trip.find({
      isScheduled: true,
      scheduledTime: { $lte: dispatchWindow, $gte: now },
      status: 'searching',
      driverId: { $exists: false },
      isCancelled: false,
    });

    return trips;
  } catch (error) {
    logger.error(`Failed to get trips for dispatch: ${error}`);
    throw error;
  }
};

/**
 * Start driver search for scheduled trip
 */
export const startScheduledTripSearch = async (
  tripId: Types.ObjectId
): Promise<ITrip> => {
  try {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    // Check if trip is not yet assigned to a driver
    if (trip.status !== 'searching') {
      throw new Error('Trip already started or completed');
    }

    // Trip is in searching status - ready for dispatch
    // This function would be called when it's time to actually dispatch
    await trip.save();

    logger.info(`Started driver search for scheduled trip ${trip.tripNumber}`);

    // Emit socket event to start matching for scheduled trip
    try {
      const matchingService = await import('./matching.service');
      matchingService.startMatching(trip);
    } catch (matchError) {
      logger.error(`Failed to start matching for scheduled trip: ${matchError}`);
    }

    return trip;
  } catch (error) {
    logger.error(`Failed to start scheduled trip search: ${error}`);
    throw error;
  }
};

/**
 * Get scheduled trips count for a date range
 */
export const getScheduledTripsStats = async (
  passengerId: Types.ObjectId,
  startDate: Date,
  endDate: Date
): Promise<{
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}> => {
  try {
    const baseQuery = {
      passengerId,
      isScheduled: true,
      scheduledTime: { $gte: startDate, $lte: endDate },
    };

    const [total, upcoming, completed, cancelled] = await Promise.all([
      Trip.countDocuments(baseQuery),
      Trip.countDocuments({
        ...baseQuery,
        scheduledTime: { $gte: new Date() },
        status: { $nin: ['trip_completed', 'cancelled'] },
      }),
      Trip.countDocuments({
        ...baseQuery,
        status: 'trip_completed',
      }),
      Trip.countDocuments({
        ...baseQuery,
        isCancelled: true,
      }),
    ]);

    return { total, upcoming, completed, cancelled };
  } catch (error) {
    logger.error(`Failed to get scheduled trips stats: ${error}`);
    throw error;
  }
};

/**
 * Get available time slots for scheduling
 */
export const getAvailableTimeSlots = (
  date: Date,
  durationMinutes: number = 30
): Date[] => {
  const slots: Date[] = [];
  const startOfDay = new Date(date);
  startOfDay.setHours(6, 0, 0, 0); // Start at 6 AM

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 0, 0, 0); // End at 11 PM

  const now = new Date();
  const minTime = new Date(now.getTime() + MIN_ADVANCE_BOOKING * 60 * 1000);

  let slotTime = new Date(startOfDay);
  while (slotTime <= endOfDay) {
    if (slotTime >= minTime) {
      slots.push(new Date(slotTime));
    }
    slotTime = new Date(slotTime.getTime() + durationMinutes * 60 * 1000);
  }

  return slots;
};

export default {
  createScheduledTrip,
  getUpcomingScheduledTrips,
  getScheduledTripDetails,
  modifyScheduledTime,
  cancelScheduledTrip,
  getTripsForDispatch,
  startScheduledTripSearch,
  getScheduledTripsStats,
  getAvailableTimeSlots,
};
