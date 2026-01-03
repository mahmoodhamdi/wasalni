import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from './index';
import { logger } from '../utils/logger';
import locationService from '../services/location.service';

let io: SocketServer | null = null;

// Track connected drivers
const connectedDrivers: Map<string, string> = new Map(); // driverId -> socketId
const connectedUsers: Map<string, string> = new Map(); // userId -> socketId

export const initializeSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // Connection handling
  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join user to their personal room (for passengers)
    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      connectedUsers.set(userId, socket.id);
      logger.info(`User ${userId} joined their room`);
    });

    // Join driver to driver room
    socket.on('join:driver', async (data: { driverId: string; latitude?: number; longitude?: number }) => {
      const { driverId, latitude, longitude } = data;
      socket.join(`driver:${driverId}`);
      socket.join('drivers:online');
      connectedDrivers.set(driverId, socket.id);

      // Update driver location if provided
      if (latitude && longitude) {
        try {
          await locationService.updateDriverLocation(driverId, latitude, longitude);
        } catch (error) {
          logger.error(`Error updating driver location on join: ${error}`);
        }
      }

      logger.info(`Driver ${driverId} joined driver rooms`);
    });

    // Leave driver room (going offline)
    socket.on('leave:driver', async (driverId: string) => {
      socket.leave(`driver:${driverId}`);
      socket.leave('drivers:online');
      connectedDrivers.delete(driverId);

      // Remove driver from location tracking
      try {
        await locationService.removeDriverLocation(driverId);
      } catch (error) {
        logger.error(`Error removing driver location: ${error}`);
      }

      logger.info(`Driver ${driverId} left driver rooms`);
    });

    // Join trip room (both passenger and driver join this for a specific trip)
    socket.on('join:trip', (tripId: string) => {
      socket.join(`trip:${tripId}`);
      logger.info(`Socket ${socket.id} joined trip room ${tripId}`);
    });

    // Leave trip room
    socket.on('leave:trip', (tripId: string) => {
      socket.leave(`trip:${tripId}`);
      logger.info(`Socket ${socket.id} left trip room ${tripId}`);
    });

    // Join admin room (for admin dashboard)
    socket.on('join:admin', () => {
      socket.join('admin:dashboard');
      socket.join('admin:emergency');
      logger.info(`Admin joined admin rooms`);
    });

    // Driver location update (continuous tracking)
    socket.on(
      'driver:location',
      async (data: { driverId: string; latitude: number; longitude: number; heading?: number; speed?: number }) => {
        try {
          const { driverId, latitude, longitude, heading, speed } = data;

          // Update location in Redis
          await locationService.updateDriverLocation(driverId, latitude, longitude, heading);

          // Broadcast to driver's own room (for any listeners)
          io?.to(`driver:${driverId}`).emit('driver:location:update', {
            driverId,
            latitude,
            longitude,
            heading,
            speed,
            updatedAt: new Date(),
          });

          // Also emit to admin dashboard for live tracking
          io?.to('admin:dashboard').emit('driver:location:update', {
            driverId,
            latitude,
            longitude,
            heading,
            speed,
            updatedAt: new Date(),
          });
        } catch (error) {
          logger.error(`Error updating driver location: ${error}`);
        }
      }
    );

    // Driver status change (online/offline/busy)
    socket.on('driver:status', async (data: { driverId: string; status: 'online' | 'offline' | 'busy' }) => {
      try {
        const { driverId, status } = data;

        if (status === 'offline') {
          await locationService.removeDriverLocation(driverId);
        }

        // Broadcast status change
        io?.to('admin:dashboard').emit('driver:status:changed', {
          driverId,
          status,
          updatedAt: new Date(),
        });

        logger.info(`Driver ${driverId} status changed to ${status}`);
      } catch (error) {
        logger.error(`Error updating driver status: ${error}`);
      }
    });

    // Disconnect handling
    socket.on('disconnect', async (reason) => {
      logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);

      // Clean up driver connection
      for (const [driverId, socketId] of connectedDrivers.entries()) {
        if (socketId === socket.id) {
          connectedDrivers.delete(driverId);
          // Optionally set driver offline after disconnect
          // await locationService.removeDriverLocation(driverId);
          logger.info(`Driver ${driverId} disconnected`);
          break;
        }
      }

      // Clean up user connection
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          logger.info(`User ${userId} disconnected`);
          break;
        }
      }
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error: ${error}`);
    });
  });

  // Initialize trip socket handlers after io is set up
  initializeTripSocketHandlers(io);

  logger.info('Socket.io initialized');
  return io;
};

/**
 * Initialize trip-specific socket handlers
 * This is called after io is initialized
 */
const initializeTripSocketHandlers = (socketServer: SocketServer): void => {
  // Import and initialize trip socket handlers
  import('../sockets/trip.socket').then(({ initializeTripSocket }) => {
    initializeTripSocket(socketServer);
  }).catch((error) => {
    logger.error(`Error initializing trip socket handlers: ${error}`);
  });
};

export const getIO = (): SocketServer | null => {
  return io;
};

// Check if a driver is connected
export const isDriverConnected = (driverId: string): boolean => {
  return connectedDrivers.has(driverId);
};

// Check if a user is connected
export const isUserConnected = (userId: string): boolean => {
  return connectedUsers.has(userId);
};

// Get connected drivers count
export const getConnectedDriversCount = (): number => {
  return connectedDrivers.size;
};

// Get connected users count
export const getConnectedUsersCount = (): number => {
  return connectedUsers.size;
};

// Get all connected driver IDs
export const getConnectedDriverIds = (): string[] => {
  return Array.from(connectedDrivers.keys());
};

// Emit to specific user
export const emitToUser = (userId: string, event: string, data: unknown): void => {
  io?.to(`user:${userId}`).emit(event, data);
};

// Emit to specific driver
export const emitToDriver = (
  driverId: string,
  event: string,
  data: unknown
): void => {
  io?.to(`driver:${driverId}`).emit(event, data);
};

// Emit to all online drivers
export const emitToAllDrivers = (event: string, data: unknown): void => {
  io?.to('drivers:online').emit(event, data);
};

// Emit to specific trip room
export const emitToTrip = (tripId: string, event: string, data: unknown): void => {
  io?.to(`trip:${tripId}`).emit(event, data);
};

// Emit to admin dashboard
export const emitToAdmin = (event: string, data: unknown): void => {
  io?.to('admin:dashboard').emit(event, data);
};

// Emit to admin emergency room
export const emitToEmergency = (event: string, data: unknown): void => {
  io?.to('admin:emergency').emit(event, data);
};

export default {
  initializeSocket,
  getIO,
  emitToUser,
  emitToDriver,
  emitToAllDrivers,
  emitToTrip,
  emitToAdmin,
  emitToEmergency,
  isDriverConnected,
  isUserConnected,
  getConnectedDriversCount,
  getConnectedUsersCount,
  getConnectedDriverIds,
};
