import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import tripService from '../services/trip.service';
import matchingService from '../services/matching.service';
import locationService from '../services/location.service';
import { successResponse, errorResponse } from '../utils/response';
import Passenger from '../models/Passenger';
import Driver from '../models/Driver';
import { TripStatus } from '../types';

/**
 * Create a new trip
 * POST /api/v1/trips
 */
export const createTrip = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse('Validation failed', 'فشل التحقق من البيانات', errors.array())
      );
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json(
        errorResponse('Not authenticated', 'غير مسجل الدخول')
      );
      return;
    }

    // Get passenger ID
    const passenger = await Passenger.findOne({ userId: new Types.ObjectId(userId) });
    if (!passenger) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Passenger not found', 'الراكب غير موجود')
      );
      return;
    }

    // Check for active trips
    const activeTrips = await tripService.getActiveTripsForPassenger(passenger._id);
    if (activeTrips.length > 0) {
      res.status(StatusCodes.CONFLICT).json(
        errorResponse(
          'You already have an active trip',
          'لديك رحلة نشطة بالفعل',
          { activeTripId: activeTrips[0]._id }
        )
      );
      return;
    }

    const { pickup, dropoff, stops, rideType, paymentMethod, scheduledTime, promoCode, notes } =
      req.body;

    // Create trip
    const trip = await tripService.createTrip({
      passengerId: passenger._id,
      pickup,
      dropoff,
      stops,
      rideType,
      tripType: scheduledTime ? 'scheduled' : 'instant',
      paymentMethod,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      promoCode,
      notes,
    });

    if (!trip) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        errorResponse('Failed to create trip', 'فشل في إنشاء الرحلة')
      );
      return;
    }

    // For instant trips, start matching
    if (!scheduledTime) {
      // Start matching in background
      matchingService.startMatching(trip).then((result) => {
        if (!result.success) {
          // Matching failed - trip already cancelled by matching service
          // Socket will notify client
        }
      });
    }

    res.status(StatusCodes.CREATED).json(
      successResponse(
        {
          trip,
          message: scheduledTime
            ? 'Trip scheduled successfully'
            : 'Searching for driver...',
        },
        scheduledTime ? 'Trip scheduled' : 'Searching for driver',
        scheduledTime ? 'تم جدولة الرحلة' : 'جاري البحث عن سائق...'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get trip by ID
 * GET /api/v1/trips/:tripId
 */
export const getTrip = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tripId } = req.params as Record<string, string>;
    const userId = req.user?.userId;

    const trip = await tripService.getTripById(tripId);
    if (!trip) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Trip not found', 'الرحلة غير موجودة')
      );
      return;
    }

    // Verify access (passenger or driver of the trip)
    const passenger = await Passenger.findOne({ userId: new Types.ObjectId(userId) });
    const driver = await Driver.findOne({ userId: new Types.ObjectId(userId) });

    const isPassenger = passenger && trip.passengerId.toString() === passenger._id.toString();
    const isDriver = driver && trip.driverId?.toString() === driver._id.toString();
    const isAdmin = req.user?.role === 'admin';

    if (!isPassenger && !isDriver && !isAdmin) {
      res.status(StatusCodes.FORBIDDEN).json(
        errorResponse('Not authorized to view this trip', 'غير مصرح لك بعرض هذه الرحلة')
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      successResponse(trip, 'Trip retrieved', 'تم استرجاع الرحلة')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get passenger trips
 * GET /api/v1/trips
 */
export const getPassengerTrips = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const passenger = await Passenger.findOne({ userId: new Types.ObjectId(userId) });
    if (!passenger) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Passenger not found', 'الراكب غير موجود')
      );
      return;
    }

    const { page = 1, limit = 10, status, dateFrom, dateTo } = req.query as Record<string, string | undefined>;

    const { trips, total } = await tripService.getPassengerTrips(
      passenger._id,
      {
        status: status as TripStatus,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      },
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Trips retrieved',
      messageAr: 'تم استرجاع الرحلات',
      data: trips,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active trip for passenger
 * GET /api/v1/trips/active
 */
export const getActiveTrip = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const passenger = await Passenger.findOne({ userId: new Types.ObjectId(userId) });
    if (!passenger) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Passenger not found', 'الراكب غير موجود')
      );
      return;
    }

    const activeTrips = await tripService.getActiveTripsForPassenger(passenger._id);

    res.status(StatusCodes.OK).json(
      successResponse(
        activeTrips.length > 0 ? activeTrips[0] : null,
        activeTrips.length > 0 ? 'Active trip found' : 'No active trip',
        activeTrips.length > 0 ? 'تم إيجاد رحلة نشطة' : 'لا توجد رحلة نشطة'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel trip
 * PUT /api/v1/trips/:tripId/cancel
 */
export const cancelTrip = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse('Validation failed', 'فشل التحقق من البيانات', errors.array())
      );
      return;
    }

    const { tripId } = req.params as Record<string, string>;
    const { reason } = req.body;
    const userId = req.user?.userId;

    const trip = await tripService.getTripById(tripId, false);
    if (!trip) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Trip not found', 'الرحلة غير موجودة')
      );
      return;
    }

    // Check if passenger
    const passenger = await Passenger.findOne({ userId: new Types.ObjectId(userId) });
    if (!passenger || trip.passengerId.toString() !== passenger._id.toString()) {
      res.status(StatusCodes.FORBIDDEN).json(
        errorResponse('Not authorized to cancel this trip', 'غير مصرح لك بإلغاء هذه الرحلة')
      );
      return;
    }

    // Cancel matching if in progress
    await matchingService.cancelMatching(tripId);

    // Cancel trip
    const cancelledTrip = await tripService.cancelTrip(tripId, 'passenger', reason);

    if (!cancelledTrip) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse('Cannot cancel this trip', 'لا يمكن إلغاء هذه الرحلة')
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      successResponse(
        {
          trip: cancelledTrip,
          cancellationFee: cancelledTrip.cancellationFee,
        },
        'Trip cancelled',
        'تم إلغاء الرحلة'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Rate trip (passenger rates driver)
 * POST /api/v1/trips/:tripId/rate
 */
export const rateTrip = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse('Validation failed', 'فشل التحقق من البيانات', errors.array())
      );
      return;
    }

    const { tripId } = req.params as Record<string, string>;
    const { score, comment, badges } = req.body;
    const userId = req.user?.userId;

    const trip = await tripService.getTripById(tripId, false);
    if (!trip) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Trip not found', 'الرحلة غير موجودة')
      );
      return;
    }

    // Check if passenger
    const passenger = await Passenger.findOne({ userId: new Types.ObjectId(userId) });
    if (!passenger || trip.passengerId.toString() !== passenger._id.toString()) {
      res.status(StatusCodes.FORBIDDEN).json(
        errorResponse('Not authorized to rate this trip', 'غير مصرح لك بتقييم هذه الرحلة')
      );
      return;
    }

    // Check if already rated
    if (trip.passengerRating) {
      res.status(StatusCodes.CONFLICT).json(
        errorResponse('Trip already rated', 'تم تقييم الرحلة مسبقاً')
      );
      return;
    }

    const ratedTrip = await tripService.rateTrip(tripId, 'passenger', score, comment, badges);

    if (!ratedTrip) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse('Cannot rate this trip', 'لا يمكن تقييم هذه الرحلة')
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      successResponse(ratedTrip, 'Trip rated successfully', 'تم تقييم الرحلة بنجاح')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Share trip
 * POST /api/v1/trips/:tripId/share
 */
export const shareTrip = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse('Validation failed', 'فشل التحقق من البيانات', errors.array())
      );
      return;
    }

    const { tripId } = req.params as Record<string, string>;
    const { contacts } = req.body;
    const userId = req.user?.userId;

    const trip = await tripService.getTripById(tripId, false);
    if (!trip) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Trip not found', 'الرحلة غير موجودة')
      );
      return;
    }

    // Check if passenger
    const passenger = await Passenger.findOne({ userId: new Types.ObjectId(userId) });
    if (!passenger || trip.passengerId.toString() !== passenger._id.toString()) {
      res.status(StatusCodes.FORBIDDEN).json(
        errorResponse('Not authorized', 'غير مصرح لك')
      );
      return;
    }

    const success = await tripService.shareTrip(tripId, contacts);

    if (!success) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        errorResponse('Failed to share trip', 'فشل في مشاركة الرحلة')
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      successResponse(null, 'Trip shared successfully', 'تم مشاركة الرحلة بنجاح')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger SOS
 * POST /api/v1/trips/:tripId/sos
 */
export const triggerSOS = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tripId } = req.params as Record<string, string>;
    const userId = req.user?.userId;

    const trip = await tripService.getTripById(tripId, false);
    if (!trip) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Trip not found', 'الرحلة غير موجودة')
      );
      return;
    }

    // Check if passenger or driver
    const passenger = await Passenger.findOne({ userId: new Types.ObjectId(userId) });
    const driver = await Driver.findOne({ userId: new Types.ObjectId(userId) });

    const isPassenger = passenger && trip.passengerId.toString() === passenger._id.toString();
    const isDriver = driver && trip.driverId?.toString() === driver._id.toString();

    if (!isPassenger && !isDriver) {
      res.status(StatusCodes.FORBIDDEN).json(
        errorResponse('Not authorized', 'غير مصرح لك')
      );
      return;
    }

    const success = await tripService.triggerSOS(tripId);

    if (!success) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        errorResponse('Failed to trigger SOS', 'فشل في تفعيل الطوارئ')
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      successResponse(null, 'SOS triggered - help is on the way', 'تم تفعيل الطوارئ - المساعدة في الطريق')
    );
  } catch (error) {
    next(error);
  }
};

// ==================== Driver Endpoints ====================

/**
 * Get available trips for driver
 * GET /api/v1/driver/trips/available
 */
export const getAvailableTrips = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const driver = await Driver.findOne({ userId: new Types.ObjectId(userId) });
    if (!driver) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Driver not found', 'السائق غير موجود')
      );
      return;
    }

    // Check if driver has pending trip request
    const pendingTripId = matchingService.getDriverPendingTrip(driver._id.toString());
    if (pendingTripId) {
      const pendingTrip = await tripService.getTripById(pendingTripId);
      res.status(StatusCodes.OK).json(
        successResponse(
          { pendingTrip },
          'Pending trip request',
          'طلب رحلة معلق'
        )
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      successResponse(null, 'No pending requests', 'لا توجد طلبات معلقة')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Accept trip request
 * PUT /api/v1/driver/trips/:tripId/accept
 */
export const acceptTrip = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tripId } = req.params as Record<string, string>;
    const userId = req.user?.userId;

    const driver = await Driver.findOne({ userId: new Types.ObjectId(userId) });
    if (!driver) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Driver not found', 'السائق غير موجود')
      );
      return;
    }

    // Check driver status
    if (driver.status !== 'approved') {
      res.status(StatusCodes.FORBIDDEN).json(
        errorResponse('Driver not approved', 'السائق غير معتمد')
      );
      return;
    }

    if (!driver.isOnline || !driver.isAvailable) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse('You must be online and available', 'يجب أن تكون متصل ومتاح')
      );
      return;
    }

    // Accept through matching service
    const success = await matchingService.driverAccept(tripId, driver._id.toString());

    if (!success) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse('Cannot accept this trip', 'لا يمكن قبول هذه الرحلة')
      );
      return;
    }

    // Get updated trip
    const trip = await tripService.getTripById(tripId);

    res.status(StatusCodes.OK).json(
      successResponse(trip, 'Trip accepted', 'تم قبول الرحلة')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reject trip request
 * PUT /api/v1/driver/trips/:tripId/reject
 */
export const rejectTrip = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tripId } = req.params as Record<string, string>;
    const userId = req.user?.userId;

    const driver = await Driver.findOne({ userId: new Types.ObjectId(userId) });
    if (!driver) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Driver not found', 'السائق غير موجود')
      );
      return;
    }

    await matchingService.driverReject(tripId, driver._id.toString());

    res.status(StatusCodes.OK).json(
      successResponse(null, 'Trip rejected', 'تم رفض الرحلة')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update trip status (driver actions)
 * PUT /api/v1/driver/trips/:tripId/status
 */
export const updateTripStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tripId } = req.params as Record<string, string>;
    const { status } = req.body;
    const userId = req.user?.userId;

    const driver = await Driver.findOne({ userId: new Types.ObjectId(userId) });
    if (!driver) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Driver not found', 'السائق غير موجود')
      );
      return;
    }

    const trip = await tripService.getTripById(tripId, false);
    if (!trip) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Trip not found', 'الرحلة غير موجودة')
      );
      return;
    }

    // Verify driver owns this trip
    if (trip.driverId?.toString() !== driver._id.toString()) {
      res.status(StatusCodes.FORBIDDEN).json(
        errorResponse('Not authorized', 'غير مصرح لك')
      );
      return;
    }

    // Get driver's current location
    const driverLocation = await locationService.getDriverLocation(driver._id);
    const location = driverLocation
      ? { type: 'Point' as const, coordinates: [driverLocation.lng, driverLocation.lat] as [number, number] }
      : undefined;

    const updatedTrip = await tripService.updateTripStatus(
      tripId,
      status as TripStatus,
      location
    );

    if (!updatedTrip) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse('Cannot update trip status', 'لا يمكن تحديث حالة الرحلة')
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      successResponse(updatedTrip, 'Trip status updated', 'تم تحديث حالة الرحلة')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Complete trip
 * PUT /api/v1/driver/trips/:tripId/complete
 */
export const completeTrip = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tripId } = req.params as Record<string, string>;
    const { actualDistance, actualDuration } = req.body;
    const userId = req.user?.userId;

    const driver = await Driver.findOne({ userId: new Types.ObjectId(userId) });
    if (!driver) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Driver not found', 'السائق غير موجود')
      );
      return;
    }

    const trip = await tripService.getTripById(tripId, false);
    if (!trip) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Trip not found', 'الرحلة غير موجودة')
      );
      return;
    }

    if (trip.driverId?.toString() !== driver._id.toString()) {
      res.status(StatusCodes.FORBIDDEN).json(
        errorResponse('Not authorized', 'غير مصرح لك')
      );
      return;
    }

    const completedTrip = await tripService.completeTrip(tripId, actualDistance, actualDuration);

    if (!completedTrip) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse('Cannot complete trip', 'لا يمكن إنهاء الرحلة')
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      successResponse(completedTrip, 'Trip completed', 'تم إنهاء الرحلة')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get driver trips
 * GET /api/v1/driver/trips
 */
export const getDriverTrips = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const driver = await Driver.findOne({ userId: new Types.ObjectId(userId) });
    if (!driver) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Driver not found', 'السائق غير موجود')
      );
      return;
    }

    const { page = 1, limit = 10, status, dateFrom, dateTo } = req.query as Record<string, string | undefined>;

    const { trips, total } = await tripService.getDriverTrips(
      driver._id,
      {
        status: status as TripStatus,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      },
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Trips retrieved',
      messageAr: 'تم استرجاع الرحلات',
      data: trips,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active trip for driver
 * GET /api/v1/driver/trips/active
 */
export const getDriverActiveTrip = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const driver = await Driver.findOne({ userId: new Types.ObjectId(userId) });
    if (!driver) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Driver not found', 'السائق غير موجود')
      );
      return;
    }

    const activeTrips = await tripService.getActiveTripsForDriver(driver._id);

    res.status(StatusCodes.OK).json(
      successResponse(
        activeTrips.length > 0 ? activeTrips[0] : null,
        activeTrips.length > 0 ? 'Active trip found' : 'No active trip',
        activeTrips.length > 0 ? 'تم إيجاد رحلة نشطة' : 'لا توجد رحلة نشطة'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Driver cancels trip
 * PUT /api/v1/driver/trips/:tripId/cancel
 */
export const driverCancelTrip = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tripId } = req.params as Record<string, string>;
    const { reason } = req.body;
    const userId = req.user?.userId;

    const driver = await Driver.findOne({ userId: new Types.ObjectId(userId) });
    if (!driver) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Driver not found', 'السائق غير موجود')
      );
      return;
    }

    const trip = await tripService.getTripById(tripId, false);
    if (!trip) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Trip not found', 'الرحلة غير موجودة')
      );
      return;
    }

    if (trip.driverId?.toString() !== driver._id.toString()) {
      res.status(StatusCodes.FORBIDDEN).json(
        errorResponse('Not authorized', 'غير مصرح لك')
      );
      return;
    }

    const cancelledTrip = await tripService.cancelTrip(tripId, 'driver', reason);

    if (!cancelledTrip) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse('Cannot cancel this trip', 'لا يمكن إلغاء هذه الرحلة')
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      successResponse(cancelledTrip, 'Trip cancelled', 'تم إلغاء الرحلة')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Rate passenger (driver rates passenger)
 * POST /api/v1/driver/trips/:tripId/rate
 */
export const ratePassenger = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse('Validation failed', 'فشل التحقق من البيانات', errors.array())
      );
      return;
    }

    const { tripId } = req.params as Record<string, string>;
    const { score, comment, badges } = req.body;
    const userId = req.user?.userId;

    const driver = await Driver.findOne({ userId: new Types.ObjectId(userId) });
    if (!driver) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Driver not found', 'السائق غير موجود')
      );
      return;
    }

    const trip = await tripService.getTripById(tripId, false);
    if (!trip) {
      res.status(StatusCodes.NOT_FOUND).json(
        errorResponse('Trip not found', 'الرحلة غير موجودة')
      );
      return;
    }

    if (trip.driverId?.toString() !== driver._id.toString()) {
      res.status(StatusCodes.FORBIDDEN).json(
        errorResponse('Not authorized', 'غير مصرح لك')
      );
      return;
    }

    if (trip.driverRating) {
      res.status(StatusCodes.CONFLICT).json(
        errorResponse('Passenger already rated', 'تم تقييم الراكب مسبقاً')
      );
      return;
    }

    const ratedTrip = await tripService.rateTrip(tripId, 'driver', score, comment, badges);

    if (!ratedTrip) {
      res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse('Cannot rate passenger', 'لا يمكن تقييم الراكب')
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      successResponse(ratedTrip, 'Passenger rated successfully', 'تم تقييم الراكب بنجاح')
    );
  } catch (error) {
    next(error);
  }
};

export default {
  createTrip,
  getTrip,
  getPassengerTrips,
  getActiveTrip,
  cancelTrip,
  rateTrip,
  shareTrip,
  triggerSOS,
  getAvailableTrips,
  acceptTrip,
  rejectTrip,
  updateTripStatus,
  completeTrip,
  getDriverTrips,
  getDriverActiveTrip,
  driverCancelTrip,
  ratePassenger,
};
