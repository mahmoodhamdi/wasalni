import { Types, FilterQuery } from 'mongoose';
import Trip, { ITrip } from '../models/Trip';
import Driver from '../models/Driver';
import Passenger from '../models/Passenger';
import User from '../models/User';
import { config } from '../config';
import { logger } from '../utils/logger';
import fareService, { RideType } from './fare.service';
import { calculateRoute, Coordinates } from './maps.service';
import { sendTripNotification, sendSOSAlert } from './notification.service';
import {
  TripStatus,
  TripType,
  PaymentMethod,
  GeoPoint,
  CancelledBy,
} from '../types';
import { Document } from 'mongoose';

// Trip document with methods
interface ITripWithMethods extends ITrip, Document {
  updateStatus(
    newStatus: TripStatus,
    location?: GeoPoint,
    note?: string
  ): Promise<ITripWithMethods>;
}

// Trip location interface
export interface TripLocation {
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  landmark?: string;
}

// Create trip request
export interface CreateTripRequest {
  passengerId: Types.ObjectId;
  pickup: TripLocation;
  dropoff: TripLocation;
  stops?: TripLocation[];
  rideType: RideType;
  tripType?: TripType;
  paymentMethod?: PaymentMethod;
  scheduledTime?: Date;
  promoCode?: string;
  notes?: string;
}

// Trip with populated fields
export interface PopulatedTrip extends Omit<ITrip, 'passengerId' | 'driverId'> {
  passengerId: {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    user?: {
      name: string;
      phone: string;
      avatar?: string;
    };
    rating: number;
  };
  driverId?: {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    user?: {
      name: string;
      phone: string;
      avatar?: string;
    };
    vehicle: {
      make: string;
      model: string;
      color: string;
      plateNumber: string;
    };
    rating: number;
    currentLocation?: GeoPoint;
  };
}

// Trip list filters
export interface TripFilters {
  status?: TripStatus | TripStatus[];
  tripType?: TripType;
  dateFrom?: Date;
  dateTo?: Date;
  minFare?: number;
  maxFare?: number;
}

// Pagination options
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Convert location to GeoPoint format
 */
const toGeoPoint = (lat: number, lng: number): GeoPoint => ({
  type: 'Point',
  coordinates: [lng, lat], // MongoDB uses [lng, lat] order
});

/**
 * Create a new trip
 */
export const createTrip = async (request: CreateTripRequest): Promise<ITrip | null> => {
  try {
    // Convert locations to trip format
    const pickup = {
      address: request.pickup.address,
      location: toGeoPoint(request.pickup.latitude, request.pickup.longitude),
      landmark: request.pickup.landmark,
    };

    const dropoff = {
      address: request.dropoff.address,
      location: toGeoPoint(request.dropoff.latitude, request.dropoff.longitude),
      landmark: request.dropoff.landmark,
    };

    // Convert stops if provided
    const stops = request.stops?.map((stop) => ({
      address: stop.address,
      location: toGeoPoint(stop.latitude, stop.longitude),
    })) || [];

    // Calculate route
    const origin: Coordinates = {
      lat: request.pickup.latitude,
      lng: request.pickup.longitude,
    };
    const destination: Coordinates = {
      lat: request.dropoff.latitude,
      lng: request.dropoff.longitude,
    };

    const routeInfo = await calculateRoute(origin, destination);

    // Get fare estimate
    const fareEstimate = await fareService.calculateFareEstimate(
      origin,
      destination,
      request.rideType
    );

    // Create trip
    const trip = new Trip({
      passengerId: request.passengerId,
      pickup,
      dropoff,
      stops,
      rideType: request.rideType,
      tripType: request.tripType || 'instant',
      paymentMethod: request.paymentMethod || 'cash',
      isScheduled: !!request.scheduledTime,
      scheduledTime: request.scheduledTime,
      route: routeInfo ? {
        encodedPolyline: routeInfo.polyline,
        distanceMeters: routeInfo.distance,
        durationSeconds: routeInfo.duration,
        distanceText: routeInfo.distanceText,
        durationText: routeInfo.durationText,
      } : undefined,
      estimatedFare: fareEstimate ? {
        min: fareEstimate.min,
        max: fareEstimate.max,
      } : undefined,
      status: 'searching',
      requestedAt: new Date(),
    });

    await trip.save();
    logger.info(`Trip ${trip.tripNumber} created for passenger ${request.passengerId}`);

    return trip;
  } catch (error) {
    logger.error(`Failed to create trip: ${error}`);
    return null;
  }
};

/**
 * Get trip by ID
 */
export const getTripById = async (
  tripId: Types.ObjectId | string,
  populate: boolean = true
): Promise<ITrip | null> => {
  try {
    let query = Trip.findById(tripId);

    if (populate) {
      query = query
        .populate({
          path: 'passengerId',
          select: 'userId rating totalTrips',
          populate: {
            path: 'userId',
            select: 'name phone avatar',
          },
        })
        .populate({
          path: 'driverId',
          select: 'userId vehicle rating currentLocation',
          populate: {
            path: 'userId',
            select: 'name phone avatar',
          },
        });
    }

    return await query.exec();
  } catch (error) {
    logger.error(`Failed to get trip ${tripId}: ${error}`);
    return null;
  }
};

/**
 * Get trip by trip number
 */
export const getTripByNumber = async (tripNumber: string): Promise<ITrip | null> => {
  try {
    return await Trip.findOne({ tripNumber })
      .populate({
        path: 'passengerId',
        select: 'userId rating',
        populate: { path: 'userId', select: 'name phone avatar' },
      })
      .populate({
        path: 'driverId',
        select: 'userId vehicle rating currentLocation',
        populate: { path: 'userId', select: 'name phone avatar' },
      });
  } catch (error) {
    logger.error(`Failed to get trip by number ${tripNumber}: ${error}`);
    return null;
  }
};

/**
 * Get active trip for passenger
 */
export const getActiveTripsForPassenger = async (
  passengerId: Types.ObjectId | string
): Promise<ITrip[]> => {
  try {
    return await Trip.findActiveForPassenger(new Types.ObjectId(passengerId));
  } catch (error) {
    logger.error(`Failed to get active trips for passenger: ${error}`);
    return [];
  }
};

/**
 * Get active trip for driver
 */
export const getActiveTripsForDriver = async (
  driverId: Types.ObjectId | string
): Promise<ITrip[]> => {
  try {
    return await Trip.findActiveForDriver(new Types.ObjectId(driverId));
  } catch (error) {
    logger.error(`Failed to get active trips for driver: ${error}`);
    return [];
  }
};

/**
 * Get trips for passenger with pagination
 */
export const getPassengerTrips = async (
  passengerId: Types.ObjectId | string,
  filters: TripFilters = {},
  pagination: PaginationOptions = { page: 1, limit: 10 }
): Promise<{ trips: ITrip[]; total: number }> => {
  try {
    const query: FilterQuery<ITrip> = {
      passengerId: new Types.ObjectId(passengerId),
    };

    // Apply filters
    if (filters.status) {
      query.status = Array.isArray(filters.status)
        ? { $in: filters.status }
        : filters.status;
    }
    if (filters.tripType) {
      query.tripType = filters.tripType;
    }
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
      if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
    }
    if (filters.minFare || filters.maxFare) {
      query['fare.total'] = {};
      if (filters.minFare) query['fare.total'].$gte = filters.minFare;
      if (filters.maxFare) query['fare.total'].$lte = filters.maxFare;
    }

    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const [trips, total] = await Promise.all([
      Trip.find(query)
        .populate({
          path: 'driverId',
          select: 'userId vehicle rating',
          populate: { path: 'userId', select: 'name phone avatar' },
        })
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit),
      Trip.countDocuments(query),
    ]);

    return { trips, total };
  } catch (error) {
    logger.error(`Failed to get passenger trips: ${error}`);
    return { trips: [], total: 0 };
  }
};

/**
 * Get trips for driver with pagination
 */
export const getDriverTrips = async (
  driverId: Types.ObjectId | string,
  filters: TripFilters = {},
  pagination: PaginationOptions = { page: 1, limit: 10 }
): Promise<{ trips: ITrip[]; total: number }> => {
  try {
    const query: FilterQuery<ITrip> = {
      driverId: new Types.ObjectId(driverId),
    };

    // Apply filters
    if (filters.status) {
      query.status = Array.isArray(filters.status)
        ? { $in: filters.status }
        : filters.status;
    }
    if (filters.tripType) {
      query.tripType = filters.tripType;
    }
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
      if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
    }

    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const [trips, total] = await Promise.all([
      Trip.find(query)
        .populate({
          path: 'passengerId',
          select: 'userId rating',
          populate: { path: 'userId', select: 'name phone avatar' },
        })
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit),
      Trip.countDocuments(query),
    ]);

    return { trips, total };
  } catch (error) {
    logger.error(`Failed to get driver trips: ${error}`);
    return { trips: [], total: 0 };
  }
};

/**
 * Update trip status
 */
export const updateTripStatus = async (
  tripId: Types.ObjectId | string,
  status: TripStatus,
  location?: GeoPoint,
  note?: string
): Promise<ITrip | null> => {
  try {
    const trip = await Trip.findById(tripId) as ITripWithMethods | null;
    if (!trip) {
      logger.warn(`Trip ${tripId} not found for status update`);
      return null;
    }

    // Validate status transition
    if (!isValidStatusTransition(trip.status, status)) {
      logger.warn(`Invalid status transition: ${trip.status} -> ${status}`);
      return null;
    }

    await trip.updateStatus(status, location, note);
    logger.info(`Trip ${trip.tripNumber} status updated to ${status}`);

    // Send FCM notifications based on status
    const notificationEvents: Record<TripStatus, string | null> = {
      searching: null,
      driver_assigned: 'driver_found',
      driver_arriving: 'driver_arriving',
      driver_arrived: 'driver_arrived',
      trip_started: 'trip_started',
      trip_completed: 'trip_completed',
      cancelled: null, // Handled separately in cancelTrip
    };

    const event = notificationEvents[status];
    if (event) {
      // Get passenger userId
      const passenger = await Passenger.findById(trip.passengerId).select('userId');
      if (passenger?.userId) {
        sendTripNotification(
          passenger.userId,
          trip._id,
          trip.tripNumber,
          event
        ).catch(err => logger.error(`Failed to send ${event} notification: ${err}`));
      }
    }

    return trip;
  } catch (error) {
    logger.error(`Failed to update trip status: ${error}`);
    return null;
  }
};

/**
 * Check if status transition is valid
 */
const isValidStatusTransition = (current: TripStatus, next: TripStatus): boolean => {
  const validTransitions: Record<TripStatus, TripStatus[]> = {
    searching: ['driver_assigned', 'cancelled'],
    driver_assigned: ['driver_arriving', 'cancelled'],
    driver_arriving: ['driver_arrived', 'cancelled'],
    driver_arrived: ['trip_started', 'cancelled'],
    trip_started: ['trip_completed', 'cancelled'],
    trip_completed: [],
    cancelled: [],
  };

  return validTransitions[current]?.includes(next) || false;
};

/**
 * Assign driver to trip
 */
export const assignDriverToTrip = async (
  tripId: Types.ObjectId | string,
  driverId: Types.ObjectId | string
): Promise<ITrip | null> => {
  try {
    const trip = await Trip.findById(tripId) as ITripWithMethods | null;
    if (!trip) return null;

    if (trip.status !== 'searching') {
      logger.warn(`Cannot assign driver to trip ${tripId} with status ${trip.status}`);
      return null;
    }

    trip.driverId = new Types.ObjectId(driverId);
    trip.acceptedBy = new Types.ObjectId(driverId);
    await trip.updateStatus('driver_assigned');

    // Update driver status
    await Driver.findByIdAndUpdate(driverId, {
      isBusy: true,
      isAvailable: false,
      currentTripId: trip._id,
    });

    // Send FCM notification to passenger
    const passenger = await Passenger.findById(trip.passengerId).select('userId');
    if (passenger?.userId) {
      sendTripNotification(
        passenger.userId,
        trip._id,
        trip.tripNumber,
        'driver_found'
      ).catch(err => logger.error(`Failed to send driver_found notification: ${err}`));
    }

    logger.info(`Driver ${driverId} assigned to trip ${trip.tripNumber}`);
    return trip;
  } catch (error) {
    logger.error(`Failed to assign driver to trip: ${error}`);
    return null;
  }
};

/**
 * Complete trip
 */
export const completeTrip = async (
  tripId: Types.ObjectId | string,
  actualDistance?: number,
  actualDuration?: number
): Promise<ITrip | null> => {
  try {
    const trip = await Trip.findById(tripId) as ITripWithMethods | null;
    if (!trip) return null;

    if (trip.status !== 'trip_started') {
      logger.warn(`Cannot complete trip ${tripId} with status ${trip.status}`);
      return null;
    }

    // Calculate waiting time
    let waitingTime = 0;
    if (trip.driverArrivedAt && trip.tripStartedAt) {
      waitingTime = (trip.tripStartedAt.getTime() - trip.driverArrivedAt.getTime()) / 1000;
    }

    // Use actual values or route values
    const distance = actualDistance || trip.route?.distanceMeters || 0;
    const duration = actualDuration || trip.route?.durationSeconds || 0;

    // Calculate final fare
    const fare = await fareService.calculateFinalFare(
      trip.rideType as RideType,
      distance,
      duration,
      waitingTime,
      trip.fare?.promoCode,
      trip.passengerId
    );

    if (fare) {
      trip.fare = fare;
      trip.driverEarnings = fare.driverEarnings;
      trip.platformEarnings = fare.platformEarnings;
      trip.waitingTime = waitingTime;

      // Apply promo code if used
      if (fare.promoCode && fare.discount > 0) {
        await fareService.applyPromoCode(
          fare.promoCode,
          trip.passengerId,
          trip._id,
          fare.discount
        );
      }
    }

    // Update trip status
    await trip.updateStatus('trip_completed');

    // Update driver status
    if (trip.driverId) {
      await Driver.findByIdAndUpdate(trip.driverId, {
        isBusy: false,
        isAvailable: true,
        currentTripId: undefined,
        $inc: {
          totalTrips: 1,
          completedTrips: 1,
          totalEarnings: fare?.driverEarnings || 0,
          currentBalance: fare?.driverEarnings || 0,
        },
      });
    }

    // Update passenger stats
    await Passenger.findByIdAndUpdate(trip.passengerId, {
      $inc: {
        totalTrips: 1,
        totalSpent: fare?.total || 0,
      },
    });

    // Send FCM notifications to both parties
    const passenger = await Passenger.findById(trip.passengerId).select('userId');
    if (passenger?.userId) {
      sendTripNotification(
        passenger.userId,
        trip._id,
        trip.tripNumber,
        'trip_completed'
      ).catch(err => logger.error(`Failed to send trip_completed notification to passenger: ${err}`));
    }

    if (trip.driverId) {
      const driver = await Driver.findById(trip.driverId).select('userId');
      if (driver?.userId) {
        sendTripNotification(
          driver.userId,
          trip._id,
          trip.tripNumber,
          'trip_completed'
        ).catch(err => logger.error(`Failed to send trip_completed notification to driver: ${err}`));
      }
    }

    logger.info(`Trip ${trip.tripNumber} completed`);
    return trip;
  } catch (error) {
    logger.error(`Failed to complete trip: ${error}`);
    return null;
  }
};

/**
 * Cancel trip
 */
export const cancelTrip = async (
  tripId: Types.ObjectId | string,
  cancelledBy: CancelledBy,
  reason?: string
): Promise<ITrip | null> => {
  try {
    const trip = await Trip.findById(tripId) as ITripWithMethods | null;
    if (!trip) return null;

    if (trip.status === 'cancelled' || trip.status === 'trip_completed') {
      logger.warn(`Cannot cancel trip ${tripId} with status ${trip.status}`);
      return null;
    }

    // Calculate cancellation fee
    const cancellationFee = await fareService.calculateCancellationFee(
      trip.requestedAt,
      trip.driverAssignedAt,
      trip.rideType as RideType
    );

    trip.isCancelled = true;
    trip.cancelledBy = cancelledBy;
    trip.cancelReason = reason;
    trip.cancellationFee = cancellationFee;

    await trip.updateStatus('cancelled');

    // Release driver if assigned
    if (trip.driverId) {
      await Driver.findByIdAndUpdate(trip.driverId, {
        isBusy: false,
        isAvailable: true,
        currentTripId: undefined,
        $inc: {
          cancelledTrips: cancelledBy === 'driver' ? 1 : 0,
        },
      });
    }

    // Send FCM notifications to the other party
    if (cancelledBy === 'driver') {
      // Notify passenger that driver cancelled
      const passenger = await Passenger.findById(trip.passengerId).select('userId');
      if (passenger?.userId) {
        sendTripNotification(
          passenger.userId,
          trip._id,
          trip.tripNumber,
          'trip_cancelled_by_driver'
        ).catch(err => logger.error(`Failed to send cancellation notification to passenger: ${err}`));
      }
    } else if (cancelledBy === 'passenger' && trip.driverId) {
      // Notify driver that passenger cancelled
      const driver = await Driver.findById(trip.driverId).select('userId');
      if (driver?.userId) {
        sendTripNotification(
          driver.userId,
          trip._id,
          trip.tripNumber,
          'trip_cancelled_by_passenger'
        ).catch(err => logger.error(`Failed to send cancellation notification to driver: ${err}`));
      }
    }

    logger.info(`Trip ${trip.tripNumber} cancelled by ${cancelledBy}`);
    return trip;
  } catch (error) {
    logger.error(`Failed to cancel trip: ${error}`);
    return null;
  }
};

/**
 * Add driver to rejected list
 */
export const addDriverToRejected = async (
  tripId: Types.ObjectId | string,
  driverId: Types.ObjectId | string
): Promise<boolean> => {
  try {
    await Trip.findByIdAndUpdate(tripId, {
      $addToSet: { rejectedBy: new Types.ObjectId(driverId) },
    });
    return true;
  } catch (error) {
    logger.error(`Failed to add driver to rejected: ${error}`);
    return false;
  }
};

/**
 * Add driver to broadcasted list
 */
export const addDriverToBroadcasted = async (
  tripId: Types.ObjectId | string,
  driverIds: Types.ObjectId[]
): Promise<boolean> => {
  try {
    await Trip.findByIdAndUpdate(tripId, {
      $addToSet: { broadcastedTo: { $each: driverIds } },
    });
    return true;
  } catch (error) {
    logger.error(`Failed to add drivers to broadcasted: ${error}`);
    return false;
  }
};

/**
 * Rate trip (passenger rates driver or vice versa)
 */
export const rateTrip = async (
  tripId: Types.ObjectId | string,
  ratedBy: 'passenger' | 'driver',
  score: number,
  comment?: string,
  badges?: string[]
): Promise<ITrip | null> => {
  try {
    const trip = await Trip.findById(tripId);
    if (!trip) return null;

    if (trip.status !== 'trip_completed') {
      logger.warn(`Cannot rate trip ${tripId} with status ${trip.status}`);
      return null;
    }

    const rating = {
      score,
      comment,
      badges: badges || [],
      createdAt: new Date(),
    };

    if (ratedBy === 'passenger') {
      trip.passengerRating = rating;
      // Update driver rating
      if (trip.driverId) {
        await updateDriverRating(trip.driverId, score);
      }
    } else {
      trip.driverRating = rating;
      // Update passenger rating
      await updatePassengerRating(trip.passengerId, score);
    }

    await trip.save();
    logger.info(`Trip ${trip.tripNumber} rated by ${ratedBy}`);
    return trip;
  } catch (error) {
    logger.error(`Failed to rate trip: ${error}`);
    return null;
  }
};

/**
 * Update driver rating average
 */
const updateDriverRating = async (
  driverId: Types.ObjectId,
  newRating: number
): Promise<void> => {
  try {
    const driver = await Driver.findById(driverId);
    if (!driver) return;

    const totalRatings = driver.totalRatings || 0;
    const currentRating = driver.rating || 5;
    const newTotal = totalRatings + 1;
    const newAverage = ((currentRating * totalRatings) + newRating) / newTotal;

    await Driver.findByIdAndUpdate(driverId, {
      rating: Math.round(newAverage * 10) / 10,
      totalRatings: newTotal,
    });
  } catch (error) {
    logger.error(`Failed to update driver rating: ${error}`);
  }
};

/**
 * Update passenger rating average
 */
const updatePassengerRating = async (
  passengerId: Types.ObjectId,
  newRating: number
): Promise<void> => {
  try {
    const passenger = await Passenger.findById(passengerId);
    if (!passenger) return;

    const totalRatings = passenger.totalRatings || 0;
    const currentRating = passenger.rating || 5;
    const newTotal = totalRatings + 1;
    const newAverage = ((currentRating * totalRatings) + newRating) / newTotal;

    await Passenger.findByIdAndUpdate(passengerId, {
      rating: Math.round(newAverage * 10) / 10,
      totalRatings: newTotal,
    });
  } catch (error) {
    logger.error(`Failed to update passenger rating: ${error}`);
  }
};

/**
 * Share trip with contacts
 */
export const shareTrip = async (
  tripId: Types.ObjectId | string,
  contacts: Array<{ name: string; phone: string }>
): Promise<boolean> => {
  try {
    const shares = contacts.map((c) => ({
      ...c,
      sharedAt: new Date(),
    }));

    await Trip.findByIdAndUpdate(tripId, {
      $push: { sharedWith: { $each: shares } },
    });

    // TODO: Send SMS to contacts with trip link
    logger.info(`Trip ${tripId} shared with ${contacts.length} contacts`);
    return true;
  } catch (error) {
    logger.error(`Failed to share trip: ${error}`);
    return false;
  }
};

/**
 * Trigger SOS for trip
 */
export const triggerSOS = async (
  tripId: Types.ObjectId | string
): Promise<boolean> => {
  try {
    const trip = await Trip.findByIdAndUpdate(
      tripId,
      {
        sosTriggered: true,
        sosAt: new Date(),
      },
      { new: true }
    ).populate({
      path: 'passengerId',
      select: 'userId',
      populate: { path: 'userId', select: 'name' },
    });

    if (!trip) {
      logger.error(`Trip ${tripId} not found for SOS`);
      return false;
    }

    // Get all admin users
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    const adminIds = admins.map(a => a._id);

    // Get passenger name and location
    const passengerUser = (trip.passengerId as any)?.userId;
    const passengerName = passengerUser?.name || 'Unknown';
    const location = trip.pickup?.address || 'Unknown location';

    // Send SOS alert to all admins
    if (adminIds.length > 0) {
      sendSOSAlert(adminIds, trip._id, passengerName, location)
        .catch(err => logger.error(`Failed to send SOS alert: ${err}`));
    }

    logger.warn(`SOS triggered for trip ${tripId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to trigger SOS: ${error}`);
    return false;
  }
};

/**
 * Get trip statistics for passenger
 */
export const getPassengerStats = async (
  passengerId: Types.ObjectId | string
): Promise<{
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalSpent: number;
}> => {
  try {
    const stats = await Trip.aggregate([
      { $match: { passengerId: new Types.ObjectId(passengerId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalFare: { $sum: '$fare.total' },
        },
      },
    ]);

    let totalTrips = 0;
    let completedTrips = 0;
    let cancelledTrips = 0;
    let totalSpent = 0;

    for (const stat of stats) {
      totalTrips += stat.count;
      if (stat._id === 'trip_completed') {
        completedTrips = stat.count;
        totalSpent = stat.totalFare;
      } else if (stat._id === 'cancelled') {
        cancelledTrips = stat.count;
      }
    }

    return { totalTrips, completedTrips, cancelledTrips, totalSpent };
  } catch (error) {
    logger.error(`Failed to get passenger stats: ${error}`);
    return { totalTrips: 0, completedTrips: 0, cancelledTrips: 0, totalSpent: 0 };
  }
};

/**
 * Get trip statistics for driver
 */
export const getDriverStats = async (
  driverId: Types.ObjectId | string
): Promise<{
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalEarnings: number;
  acceptanceRate: number;
  cancellationRate: number;
}> => {
  try {
    const stats = await Trip.aggregate([
      { $match: { driverId: new Types.ObjectId(driverId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalEarnings: { $sum: '$driverEarnings' },
        },
      },
    ]);

    let totalTrips = 0;
    let completedTrips = 0;
    let cancelledTrips = 0;
    let totalEarnings = 0;

    for (const stat of stats) {
      totalTrips += stat.count;
      if (stat._id === 'trip_completed') {
        completedTrips = stat.count;
        totalEarnings = stat.totalEarnings;
      } else if (stat._id === 'cancelled') {
        cancelledTrips = stat.count;
      }
    }

    const acceptanceRate = totalTrips > 0
      ? Math.round((completedTrips / totalTrips) * 100)
      : 100;

    const cancellationRate = totalTrips > 0
      ? Math.round((cancelledTrips / totalTrips) * 100)
      : 0;

    return {
      totalTrips,
      completedTrips,
      cancelledTrips,
      totalEarnings,
      acceptanceRate,
      cancellationRate,
    };
  } catch (error) {
    logger.error(`Failed to get driver stats: ${error}`);
    return {
      totalTrips: 0,
      completedTrips: 0,
      cancelledTrips: 0,
      totalEarnings: 0,
      acceptanceRate: 100,
      cancellationRate: 0,
    };
  }
};

export default {
  createTrip,
  getTripById,
  getTripByNumber,
  getActiveTripsForPassenger,
  getActiveTripsForDriver,
  getPassengerTrips,
  getDriverTrips,
  updateTripStatus,
  assignDriverToTrip,
  completeTrip,
  cancelTrip,
  addDriverToRejected,
  addDriverToBroadcasted,
  rateTrip,
  shareTrip,
  triggerSOS,
  getPassengerStats,
  getDriverStats,
};
