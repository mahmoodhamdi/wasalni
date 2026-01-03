import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { validationResult } from 'express-validator';
import scheduledService from '../services/scheduled.service';
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
 * Create a scheduled trip
 */
export const createScheduledTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendBadRequest(res, 'Validation failed', 'فشل التحقق من البيانات');
      return;
    }

    const passengerId = req.user?.passengerId;
    if (!passengerId) {
      sendUnauthorized(res, 'Passenger not found', 'لم يتم العثور على الراكب');
      return;
    }

    const {
      pickup,
      dropoff,
      stops,
      rideType,
      scheduledTime,
      paymentMethod,
      promoCode,
      notes,
    } = req.body;

    const trip = await scheduledService.createScheduledTrip({
      passengerId: new Types.ObjectId(passengerId),
      pickup,
      dropoff,
      stops,
      rideType,
      scheduledTime: new Date(scheduledTime),
      paymentMethod,
      promoCode,
      notes,
    });

    sendCreated(
      res,
      {
        trip: {
          id: trip._id,
          tripNumber: trip.tripNumber,
          scheduledTime: trip.scheduledTime,
          pickup: {
            address: trip.pickup.address,
            coordinates: trip.pickup.location.coordinates,
          },
          dropoff: {
            address: trip.dropoff.address,
            coordinates: trip.dropoff.location.coordinates,
          },
          estimatedFare: trip.estimatedFare,
          rideType: trip.rideType,
          status: trip.status,
        },
      },
      'Scheduled trip created successfully',
      'تم إنشاء الرحلة المجدولة بنجاح'
    );
  } catch (error: any) {
    logger.error(`Create scheduled trip error: ${error.message}`);
    sendBadRequest(res, error.message, error.message);
  }
};

/**
 * Get upcoming scheduled trips for passenger
 */
export const getUpcomingTrips = async (req: Request, res: Response): Promise<void> => {
  try {
    const passengerId = req.user?.passengerId;
    if (!passengerId) {
      sendUnauthorized(res, 'Passenger not found', 'لم يتم العثور على الراكب');
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await scheduledService.getUpcomingScheduledTrips(
      new Types.ObjectId(passengerId),
      { page, limit }
    );

    sendSuccess(res, result, 'Upcoming trips retrieved', 'تم استرجاع الرحلات المجدولة');
  } catch (error: any) {
    logger.error(`Get upcoming trips error: ${error.message}`);
    sendError(res, 'Failed to get scheduled trips', 'فشل في استرجاع الرحلات المجدولة');
  }
};

/**
 * Get scheduled trip details
 */
export const getTripDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const passengerId = req.user?.passengerId;
    if (!passengerId) {
      sendUnauthorized(res, 'Passenger not found', 'لم يتم العثور على الراكب');
      return;
    }

    const { tripId } = req.params;
    if (!Types.ObjectId.isValid(tripId)) {
      sendBadRequest(res, 'Invalid trip ID', 'معرف الرحلة غير صالح');
      return;
    }

    const trip = await scheduledService.getScheduledTripDetails(
      new Types.ObjectId(tripId),
      new Types.ObjectId(passengerId)
    );

    if (!trip) {
      sendNotFound(res, 'Scheduled trip not found', 'لم يتم العثور على الرحلة المجدولة');
      return;
    }

    sendSuccess(res, { trip }, 'Trip details retrieved', 'تم استرجاع تفاصيل الرحلة');
  } catch (error: any) {
    logger.error(`Get trip details error: ${error.message}`);
    sendError(res, 'Failed to get trip details', 'فشل في استرجاع تفاصيل الرحلة');
  }
};

/**
 * Modify scheduled trip time
 */
export const modifyTripTime = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendBadRequest(res, 'Validation failed', 'فشل التحقق من البيانات');
      return;
    }

    const passengerId = req.user?.passengerId;
    if (!passengerId) {
      sendUnauthorized(res, 'Passenger not found', 'لم يتم العثور على الراكب');
      return;
    }

    const { tripId } = req.params;
    const { scheduledTime } = req.body;

    if (!Types.ObjectId.isValid(tripId)) {
      sendBadRequest(res, 'Invalid trip ID', 'معرف الرحلة غير صالح');
      return;
    }

    const trip = await scheduledService.modifyScheduledTime(
      new Types.ObjectId(tripId),
      new Types.ObjectId(passengerId),
      new Date(scheduledTime)
    );

    sendSuccess(
      res,
      {
        trip: {
          id: trip._id,
          tripNumber: trip.tripNumber,
          scheduledTime: trip.scheduledTime,
        },
      },
      'Trip time modified successfully',
      'تم تعديل موعد الرحلة بنجاح'
    );
  } catch (error: any) {
    logger.error(`Modify trip time error: ${error.message}`);
    sendBadRequest(res, error.message, error.message);
  }
};

/**
 * Cancel scheduled trip
 */
export const cancelTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const passengerId = req.user?.passengerId;
    if (!passengerId) {
      sendUnauthorized(res, 'Passenger not found', 'لم يتم العثور على الراكب');
      return;
    }

    const { tripId } = req.params;
    const { reason } = req.body;

    if (!Types.ObjectId.isValid(tripId)) {
      sendBadRequest(res, 'Invalid trip ID', 'معرف الرحلة غير صالح');
      return;
    }

    const trip = await scheduledService.cancelScheduledTrip(
      new Types.ObjectId(tripId),
      new Types.ObjectId(passengerId),
      reason
    );

    sendSuccess(
      res,
      {
        trip: {
          id: trip._id,
          tripNumber: trip.tripNumber,
          cancellationFee: trip.cancellationFee,
        },
      },
      'Trip cancelled successfully',
      'تم إلغاء الرحلة بنجاح'
    );
  } catch (error: any) {
    logger.error(`Cancel trip error: ${error.message}`);
    sendBadRequest(res, error.message, error.message);
  }
};

/**
 * Get scheduled trips statistics
 */
export const getTripsStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const passengerId = req.user?.passengerId;
    if (!passengerId) {
      sendUnauthorized(res, 'Passenger not found', 'لم يتم العثور على الراكب');
      return;
    }

    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const stats = await scheduledService.getScheduledTripsStats(
      new Types.ObjectId(passengerId),
      startDate,
      endDate
    );

    sendSuccess(res, { stats }, 'Stats retrieved', 'تم استرجاع الإحصائيات');
  } catch (error: any) {
    logger.error(`Get trips stats error: ${error.message}`);
    sendError(res, 'Failed to get stats', 'فشل في استرجاع الإحصائيات');
  }
};

/**
 * Get available time slots for a date
 */
export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.query;
    if (!date) {
      sendBadRequest(res, 'Date is required', 'التاريخ مطلوب');
      return;
    }

    const targetDate = new Date(date as string);
    if (isNaN(targetDate.getTime())) {
      sendBadRequest(res, 'Invalid date format', 'صيغة التاريخ غير صالحة');
      return;
    }

    const slots = scheduledService.getAvailableTimeSlots(targetDate);

    sendSuccess(
      res,
      {
        date: targetDate.toISOString().split('T')[0],
        slots: slots.map((slot) => slot.toISOString()),
        count: slots.length,
      },
      'Available slots retrieved',
      'تم استرجاع المواعيد المتاحة'
    );
  } catch (error: any) {
    logger.error(`Get available slots error: ${error.message}`);
    sendError(res, 'Failed to get available slots', 'فشل في استرجاع المواعيد المتاحة');
  }
};

export default {
  createScheduledTrip,
  getUpcomingTrips,
  getTripDetails,
  modifyTripTime,
  cancelTrip,
  getTripsStats,
  getAvailableSlots,
};
