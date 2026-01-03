import { Server as SocketServer, Socket } from 'socket.io';
import { Types } from 'mongoose';
import { logger } from '../utils/logger';
import Trip from '../models/Trip';
import Driver from '../models/Driver';
import User from '../models/User';
import {
  matchingEvents,
  driverAccept,
  driverReject,
  getDriverPendingTrip,
} from '../services/matching.service';
import locationService from '../services/location.service';
import * as notificationService from '../services/notification.service';
import { emitToUser, emitToDriver, emitToTrip, getIO } from '../config/socket';

// Helper to extract ID string from ObjectId or populated document
const extractId = (field: unknown): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (field instanceof Types.ObjectId) return field.toString();
  if (typeof field === 'object' && field !== null && '_id' in field) {
    return String((field as { _id: unknown })._id);
  }
  return String(field);
};

// Trip request payload sent to drivers
interface TripRequestPayload {
  tripId: string;
  tripNumber: string;
  pickup: {
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoff: {
    address: string;
    latitude: number;
    longitude: number;
  };
  distance: number;
  rideType: string;
  estimatedFare: {
    min: number;
    max: number;
  };
  distanceToPickup: number;
  timeout: number; // seconds
}

// Driver location update payload
interface DriverLocationPayload {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

/**
 * Initialize trip socket handlers
 */
export const initializeTripSocket = (io: SocketServer): void => {
  // Listen for matching service events
  setupMatchingEventListeners();

  // Set up socket connection handlers
  io.on('connection', (socket: Socket) => {
    // Handle driver accepting a trip
    socket.on('trip:accept', async (data: { tripId: string; driverId: string }) => {
      try {
        const { tripId, driverId } = data;
        logger.info(`Driver ${driverId} accepting trip ${tripId}`);

        const success = await driverAccept(tripId, driverId);

        if (success) {
          // Get updated trip details
          const trip = await Trip.findById(tripId)
            .populate('driverId', 'name phone avatar rating vehicle')
            .lean();

          if (trip) {
            // Notify passenger via socket
            emitToUser(trip.passengerId.toString(), 'trip:accepted', {
              tripId: trip._id.toString(),
              tripNumber: trip.tripNumber,
              driver: trip.driverId,
              status: trip.status,
            });

            // Send push notification to passenger
            const passenger = await Trip.findById(tripId).populate('passengerId').lean() as any;
            if (passenger?.passengerId?.user) {
              await notificationService.sendTripNotification(
                new Types.ObjectId(passenger.passengerId.user),
                trip._id as Types.ObjectId,
                trip.tripNumber,
                'driver_found'
              );
            }

            // Confirm to driver
            socket.emit('trip:accept:success', {
              tripId: trip._id.toString(),
              tripNumber: trip.tripNumber,
              pickup: trip.pickup,
              dropoff: trip.dropoff,
              passenger: {
                id: trip.passengerId.toString(),
              },
            });

            // Make both join the trip room
            socket.join(`trip:${tripId}`);
          }
        } else {
          socket.emit('trip:accept:failed', {
            tripId,
            message: 'Trip already taken or no longer available',
            messageAr: 'الرحلة تم قبولها من سائق آخر أو لم تعد متاحة',
          });
        }
      } catch (error) {
        logger.error(`Error accepting trip: ${error}`);
        socket.emit('trip:accept:failed', {
          tripId: data.tripId,
          message: 'Error accepting trip',
          messageAr: 'حدث خطأ أثناء قبول الرحلة',
        });
      }
    });

    // Handle driver rejecting a trip
    socket.on('trip:reject', async (data: { tripId: string; driverId: string }) => {
      try {
        const { tripId, driverId } = data;
        logger.info(`Driver ${driverId} rejecting trip ${tripId}`);

        await driverReject(tripId, driverId);

        socket.emit('trip:reject:success', { tripId });
      } catch (error) {
        logger.error(`Error rejecting trip: ${error}`);
      }
    });

    // Handle driver location updates during trip
    socket.on('trip:driver:location', async (data: DriverLocationPayload & { tripId: string }) => {
      try {
        const { tripId, driverId, latitude, longitude, heading, speed } = data;

        // Update driver location in Redis
        await locationService.updateDriverLocation(driverId, latitude, longitude, heading);

        // Broadcast to trip room (passenger gets this)
        emitToTrip(tripId, 'trip:driver:location', {
          tripId,
          latitude,
          longitude,
          heading,
          speed,
          updatedAt: new Date(),
        });
      } catch (error) {
        logger.error(`Error updating driver location: ${error}`);
      }
    });

    // Handle trip status updates
    socket.on(
      'trip:status:update',
      async (data: { tripId: string; status: string; location?: { lat: number; lng: number } }) => {
        try {
          const { tripId, status, location } = data;

          // Broadcast status to trip room
          emitToTrip(tripId, 'trip:status:updated', {
            tripId,
            status,
            location,
            updatedAt: new Date(),
          });
        } catch (error) {
          logger.error(`Error broadcasting status update: ${error}`);
        }
      }
    );

    // Handle passenger cancellation
    socket.on('trip:cancel:passenger', async (data: { tripId: string; passengerId: string; reason?: string }) => {
      try {
        const { tripId, passengerId, reason } = data;
        logger.info(`Passenger ${passengerId} cancelling trip ${tripId}`);

        const trip = await Trip.findById(tripId).populate('driverId').lean() as any;
        if (trip && trip.driverId) {
          // Notify driver via socket
          emitToDriver(trip.driverId._id.toString(), 'trip:cancelled', {
            tripId,
            cancelledBy: 'passenger',
            reason: reason || 'Passenger cancelled',
            reasonAr: 'الراكب ألغى الرحلة',
          });

          // Send push notification to driver
          if (trip.driverId.user) {
            await notificationService.sendTripNotification(
              new Types.ObjectId(trip.driverId.user),
              new Types.ObjectId(tripId),
              trip.tripNumber,
              'trip_cancelled_by_passenger'
            );
          }
        }
      } catch (error) {
        logger.error(`Error handling passenger cancellation: ${error}`);
      }
    });

    // Handle driver cancellation
    socket.on('trip:cancel:driver', async (data: { tripId: string; driverId: string; reason?: string }) => {
      try {
        const { tripId, driverId, reason } = data;
        logger.info(`Driver ${driverId} cancelling trip ${tripId}`);

        const trip = await Trip.findById(tripId).populate('passengerId').lean() as any;
        if (trip) {
          // Notify passenger via socket
          emitToUser(trip.passengerId._id.toString(), 'trip:cancelled', {
            tripId,
            cancelledBy: 'driver',
            reason: reason || 'Driver cancelled',
            reasonAr: 'السائق ألغى الرحلة',
          });

          // Send push notification to passenger
          if (trip.passengerId.user) {
            await notificationService.sendTripNotification(
              new Types.ObjectId(trip.passengerId.user),
              new Types.ObjectId(tripId),
              trip.tripNumber,
              'trip_cancelled_by_driver'
            );
          }
        }
      } catch (error) {
        logger.error(`Error handling driver cancellation: ${error}`);
      }
    });

    // Handle SOS trigger
    socket.on('trip:sos', async (data: { tripId: string; userId: string; userType: 'passenger' | 'driver'; location: { lat: number; lng: number } }) => {
      try {
        const { tripId, userId, userType, location } = data;
        logger.warn(`SOS triggered for trip ${tripId} by ${userType} ${userId}`);

        const trip = await Trip.findById(tripId);
        if (trip) {
          // Notify the other party
          if (userType === 'passenger' && trip.driverId) {
            emitToDriver(trip.driverId.toString(), 'trip:sos:alert', {
              tripId,
              triggeredBy: 'passenger',
              location,
            });
          } else if (userType === 'driver') {
            emitToUser(trip.passengerId.toString(), 'trip:sos:alert', {
              tripId,
              triggeredBy: 'driver',
              location,
            });
          }

          // Broadcast to admin/emergency room
          getIO()?.to('admin:emergency').emit('trip:sos:emergency', {
            tripId,
            tripNumber: trip.tripNumber,
            triggeredBy: userType,
            userId,
            location,
            timestamp: new Date(),
          });

          // Send push notification to all admins
          const admins = await User.find({ role: 'admin' }).select('_id').lean();
          if (admins.length > 0) {
            const adminIds = admins.map(a => a._id as Types.ObjectId);
            await notificationService.sendSOSAlert(
              adminIds,
              new Types.ObjectId(tripId),
              userType === 'passenger' ? 'Passenger' : 'Driver',
              `Lat: ${location.lat}, Lng: ${location.lng}`
            );
          }
        }
      } catch (error) {
        logger.error(`Error handling SOS: ${error}`);
      }
    });

    // Handle chat messages during trip
    socket.on('trip:chat', async (data: { tripId: string; senderId: string; senderType: 'passenger' | 'driver'; message: string }) => {
      try {
        const { tripId, senderId, senderType, message } = data;

        // Broadcast to trip room
        emitToTrip(tripId, 'trip:chat:message', {
          tripId,
          senderId,
          senderType,
          message,
          sentAt: new Date(),
        });
      } catch (error) {
        logger.error(`Error sending chat message: ${error}`);
      }
    });

    // Handle trip completion rating
    socket.on('trip:rate', async (data: { tripId: string; raterId: string; raterType: 'passenger' | 'driver'; score: number; comment?: string }) => {
      try {
        const { tripId, raterId, raterType, score, comment } = data;

        const trip = await Trip.findById(tripId);
        if (trip) {
          // Notify the rated party
          if (raterType === 'passenger' && trip.driverId) {
            emitToDriver(trip.driverId.toString(), 'trip:rated', {
              tripId,
              score,
              ratedBy: 'passenger',
            });
          } else if (raterType === 'driver') {
            emitToUser(trip.passengerId.toString(), 'trip:rated', {
              tripId,
              score,
              ratedBy: 'driver',
            });
          }
        }
      } catch (error) {
        logger.error(`Error handling rating: ${error}`);
      }
    });
  });

  logger.info('Trip socket handlers initialized');
};

/**
 * Set up listeners for matching service events
 */
const setupMatchingEventListeners = (): void => {
  // When a driver needs to be notified of a new trip
  matchingEvents.on('notify_driver', async (data: { tripId: string; driverId: string; distance: number }) => {
    try {
      const { tripId, driverId, distance } = data;

      // Get trip details
      const trip = await Trip.findById(tripId).lean();
      if (!trip) return;

      // Build payload for driver
      const payload: TripRequestPayload = {
        tripId: trip._id.toString(),
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
        distance: trip.route?.distanceMeters || 0,
        rideType: trip.rideType,
        estimatedFare: trip.estimatedFare || { min: 0, max: 0 },
        distanceToPickup: distance,
        timeout: 15, // Driver has 15 seconds to respond
      };

      // Send to driver via socket
      emitToDriver(driverId, 'trip:request', payload);

      // Send push notification to driver
      const driver = await Driver.findById(driverId).lean() as any;
      if (driver?.user) {
        await notificationService.sendTripNotification(
          new Types.ObjectId(driver.user),
          trip._id as Types.ObjectId,
          trip.tripNumber,
          'new_trip_request'
        );
      }

      logger.debug(`Sent trip request to driver ${driverId}`);
    } catch (error) {
      logger.error(`Error notifying driver: ${error}`);
    }
  });

  // When no drivers are found
  matchingEvents.on('no_drivers', async (data: { tripId: string }) => {
    try {
      const trip = await Trip.findById(data.tripId);
      if (trip) {
        emitToUser(trip.passengerId.toString(), 'trip:no_drivers', {
          tripId: data.tripId,
          message: 'No drivers available in your area',
          messageAr: 'لا يوجد سائقين متاحين في منطقتك',
        });
      }
    } catch (error) {
      logger.error(`Error handling no_drivers event: ${error}`);
    }
  });

  // When matching times out
  matchingEvents.on('match_timeout', async (data: { tripId: string }) => {
    try {
      const trip = await Trip.findById(data.tripId);
      if (trip) {
        emitToUser(trip.passengerId.toString(), 'trip:timeout', {
          tripId: data.tripId,
          message: 'Could not find a driver. Please try again.',
          messageAr: 'لم نتمكن من إيجاد سائق. يرجى المحاولة مرة أخرى.',
        });
      }
    } catch (error) {
      logger.error(`Error handling match_timeout event: ${error}`);
    }
  });

  logger.info('Matching service event listeners set up');
};

/**
 * Emit trip status change to all relevant parties
 */
export const emitTripStatusChange = async (
  tripId: string,
  status: string,
  additionalData?: Record<string, unknown>
): Promise<void> => {
  try {
    const trip = await Trip.findById(tripId)
      .populate('driverId', 'name phone avatar rating vehicle')
      .lean();

    if (!trip) return;

    const payload = {
      tripId,
      tripNumber: trip.tripNumber,
      status,
      updatedAt: new Date(),
      ...additionalData,
    };

    // Notify passenger via socket
    emitToUser(extractId(trip.passengerId), `trip:${status}`, payload);

    // Notify driver if assigned
    if (trip.driverId) {
      const driverId = extractId(trip.driverId);
      if (driverId) {
        emitToDriver(driverId, `trip:${status}`, payload);
      }
    }

    // Broadcast to trip room
    emitToTrip(tripId, 'trip:status:changed', payload);

    // Send push notifications based on status
    const statusToEvent: Record<string, string> = {
      driver_arriving: 'driver_arriving',
      driver_arrived: 'driver_arrived',
      trip_started: 'trip_started',
      trip_completed: 'trip_completed',
    };

    if (statusToEvent[status]) {
      // Populate passenger for notification
      const fullTrip = await Trip.findById(tripId).populate('passengerId').lean() as any;
      if (fullTrip?.passengerId?.user) {
        await notificationService.sendTripNotification(
          new Types.ObjectId(fullTrip.passengerId.user),
          new Types.ObjectId(tripId),
          trip.tripNumber,
          statusToEvent[status]
        );
      }
    }

    logger.info(`Trip ${tripId} status changed to ${status}`);
  } catch (error) {
    logger.error(`Error emitting trip status change: ${error}`);
  }
};

/**
 * Emit trip completion with fare details
 */
export const emitTripCompleted = async (tripId: string): Promise<void> => {
  try {
    const trip = await Trip.findById(tripId)
      .populate('driverId', 'name phone avatar rating vehicle')
      .populate('passengerId', 'name phone avatar rating')
      .lean();

    if (!trip) return;

    const passengerPayload = {
      tripId,
      tripNumber: trip.tripNumber,
      status: 'trip_completed',
      fare: trip.fare,
      driver: trip.driverId,
      paymentMethod: trip.paymentMethod,
      paymentStatus: trip.paymentStatus,
    };

    const driverPayload = {
      tripId,
      tripNumber: trip.tripNumber,
      status: 'trip_completed',
      fare: trip.fare,
      driverEarnings: trip.driverEarnings,
      passenger: trip.passengerId,
      paymentMethod: trip.paymentMethod,
      paymentStatus: trip.paymentStatus,
    };

    // Notify passenger
    emitToUser(extractId(trip.passengerId), 'trip:completed', passengerPayload);

    // Notify driver
    if (trip.driverId) {
      const driverId = extractId(trip.driverId);
      if (driverId) {
        emitToDriver(driverId, 'trip:completed', driverPayload);
      }
    }

    logger.info(`Trip ${tripId} completion emitted`);
  } catch (error) {
    logger.error(`Error emitting trip completion: ${error}`);
  }
};

/**
 * Notify passenger of driver arrival
 */
export const emitDriverArrived = async (tripId: string): Promise<void> => {
  try {
    const trip = await Trip.findById(tripId)
      .populate('driverId', 'name phone avatar vehicle')
      .lean();

    if (!trip) return;

    emitToUser(trip.passengerId.toString(), 'trip:driver_arrived', {
      tripId,
      tripNumber: trip.tripNumber,
      driver: trip.driverId,
      message: 'Your driver has arrived',
      messageAr: 'وصل السائق',
    });

    logger.info(`Driver arrival notification sent for trip ${tripId}`);
  } catch (error) {
    logger.error(`Error emitting driver arrival: ${error}`);
  }
};

export default {
  initializeTripSocket,
  emitTripStatusChange,
  emitTripCompleted,
  emitDriverArrived,
};
