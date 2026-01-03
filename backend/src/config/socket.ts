import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from './index';
import { logger } from '../utils/logger';

let io: SocketServer | null = null;

export const initializeSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Connection handling
  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join user to their personal room
    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      logger.info(`User ${userId} joined their room`);
    });

    // Join driver to driver room
    socket.on('join:driver', (driverId: string) => {
      socket.join(`driver:${driverId}`);
      socket.join('drivers:online');
      logger.info(`Driver ${driverId} joined driver rooms`);
    });

    // Leave driver room
    socket.on('leave:driver', (driverId: string) => {
      socket.leave(`driver:${driverId}`);
      socket.leave('drivers:online');
      logger.info(`Driver ${driverId} left driver rooms`);
    });

    // Join trip room
    socket.on('join:trip', (tripId: string) => {
      socket.join(`trip:${tripId}`);
      logger.info(`Socket ${socket.id} joined trip room ${tripId}`);
    });

    // Leave trip room
    socket.on('leave:trip', (tripId: string) => {
      socket.leave(`trip:${tripId}`);
      logger.info(`Socket ${socket.id} left trip room ${tripId}`);
    });

    // Driver location update
    socket.on(
      'driver:location',
      (data: { driverId: string; lat: number; lng: number; heading: number }) => {
        // Broadcast to relevant rooms
        io?.to(`driver:${data.driverId}`).emit('driver:location:update', data);
      }
    );

    // Disconnect handling
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error: ${error}`);
    });
  });

  logger.info('Socket.io initialized');
  return io;
};

export const getIO = (): SocketServer | null => {
  return io;
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

export default {
  initializeSocket,
  getIO,
  emitToUser,
  emitToDriver,
  emitToAllDrivers,
  emitToTrip,
};
