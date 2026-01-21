import { Types } from 'mongoose';
import { EventEmitter } from 'events';
import { ITrip } from '../models/Trip';
import { config } from '../config';
import { logger } from '../utils/logger';
import locationService from './location.service';
import tripService from './trip.service';
import { RideType } from './fare.service';

// Matching configuration
const MATCHING_CONFIG = {
  maxSearchRadius: config.app.maxSearchRadius, // km
  driverTimeout: 15, // seconds to wait for driver response
  maxRetries: 5, // max number of driver batches to try
  batchSize: 5, // drivers to notify at once
  totalTimeout: config.app.driverSearchTimeout, // total search timeout in seconds
};

// Matching event types
export type MatchingEvent =
  | 'driver_found'
  | 'driver_rejected'
  | 'driver_timeout'
  | 'no_drivers'
  | 'match_timeout'
  | 'driver_accepted';

// Matching result
export interface MatchingResult {
  success: boolean;
  tripId: string;
  driverId?: string;
  message: string;
  messageAr: string;
}

// Active matching session
interface MatchingSession {
  tripId: string;
  passengerId: string;
  pickupLat: number;
  pickupLng: number;
  rideType: RideType;
  currentBatch: number;
  attemptedDrivers: Set<string>;
  startTime: number;
  timeout?: NodeJS.Timeout;
  resolvePromise?: (result: MatchingResult) => void;
}

// Singleton class for managing matching
class MatchingManager extends EventEmitter {
  private activeSessions: Map<string, MatchingSession> = new Map();
  private driverPendingTrips: Map<string, string> = new Map(); // driverId -> tripId

  constructor() {
    super();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.on('driver_accepted', this.handleDriverAccepted.bind(this));
    this.on('driver_rejected', this.handleDriverRejected.bind(this));
    this.on('driver_timeout', this.handleDriverTimeout.bind(this));
  }

  /**
   * Start matching for a trip
   */
  async startMatching(trip: ITrip): Promise<MatchingResult> {
    const tripId = trip._id.toString();

    // Check if already matching
    if (this.activeSessions.has(tripId)) {
      return {
        success: false,
        tripId,
        message: 'Matching already in progress',
        messageAr: 'البحث عن سائق جاري بالفعل',
      };
    }

    // Create session
    const session: MatchingSession = {
      tripId,
      passengerId: trip.passengerId.toString(),
      pickupLat: trip.pickup.location.coordinates[1],
      pickupLng: trip.pickup.location.coordinates[0],
      rideType: trip.rideType as RideType,
      currentBatch: 0,
      attemptedDrivers: new Set(),
      startTime: Date.now(),
    };

    this.activeSessions.set(tripId, session);

    logger.info(`Starting matching for trip ${trip.tripNumber}`);

    return new Promise((resolve) => {
      session.resolvePromise = resolve;

      // Set total timeout
      session.timeout = setTimeout(() => {
        this.handleMatchTimeout(tripId);
      }, MATCHING_CONFIG.totalTimeout * 1000);

      // Start searching
      this.searchNextBatch(tripId);
    });
  }

  /**
   * Search for next batch of drivers
   */
  private async searchNextBatch(tripId: string): Promise<void> {
    const session = this.activeSessions.get(tripId);
    if (!session) return;

    // Check if we've exceeded max retries
    if (session.currentBatch >= MATCHING_CONFIG.maxRetries) {
      this.handleNoDrivers(tripId);
      return;
    }

    session.currentBatch++;

    try {
      // Get category from ride type
      const category = this.getRideCategory(session.rideType);

      // Find nearby drivers
      const nearbyDrivers = await locationService.findNearbyDrivers(
        session.pickupLat,
        session.pickupLng,
        MATCHING_CONFIG.maxSearchRadius,
        MATCHING_CONFIG.batchSize * 2, // Get more to filter
        undefined,
        category
      );

      // Filter out already attempted drivers
      const availableDrivers = nearbyDrivers.filter(
        (d) => !session.attemptedDrivers.has(d.driverId)
      );

      if (availableDrivers.length === 0) {
        // No more drivers available
        this.handleNoDrivers(tripId);
        return;
      }

      // Sort by distance and rating
      availableDrivers.sort((a, b) => {
        const distScore = a.distance - b.distance;
        const ratingScore = ((b.driver?.rating || 0) - (a.driver?.rating || 0)) * 0.3;
        return distScore + ratingScore;
      });

      // Take batch
      const batch = availableDrivers.slice(0, MATCHING_CONFIG.batchSize);

      // Mark as attempted
      batch.forEach((d) => session.attemptedDrivers.add(d.driverId));

      // Add to broadcasted list
      await tripService.addDriverToBroadcasted(
        tripId,
        batch.map((d) => new Types.ObjectId(d.driverId))
      );

      // Broadcast to drivers
      for (const driver of batch) {
        this.notifyDriver(tripId, driver.driverId, driver.distance);
      }

      logger.info(
        `Batch ${session.currentBatch}: Notified ${batch.length} drivers for trip ${tripId}`
      );

      // Wait for responses
      setTimeout(() => {
        const currentSession = this.activeSessions.get(tripId);
        if (currentSession && currentSession.currentBatch === session.currentBatch) {
          // No driver accepted in this batch, try next
          this.searchNextBatch(tripId);
        }
      }, MATCHING_CONFIG.driverTimeout * 1000);
    } catch (error) {
      logger.error(`Error searching for drivers: ${error}`);
      this.handleNoDrivers(tripId);
    }
  }

  /**
   * Get ride category from ride type
   */
  private getRideCategory(rideType: RideType): string | undefined {
    if (['economy', 'comfort', 'family'].includes(rideType)) {
      return rideType;
    }
    return undefined; // tuktuk and motorcycle don't have category
  }

  /**
   * Notify driver of trip request
   */
  private notifyDriver(tripId: string, driverId: string, distance: number): void {
    // Store pending trip for driver
    this.driverPendingTrips.set(driverId, tripId);

    // Emit event for socket handler
    this.emit('notify_driver', {
      tripId,
      driverId,
      distance,
    });

    logger.debug(`Notified driver ${driverId} for trip ${tripId}`);
  }

  /**
   * Handle driver acceptance
   */
  async driverAccept(tripId: string, driverId: string): Promise<boolean> {
    const session = this.activeSessions.get(tripId);
    if (!session) {
      logger.warn(`No active session for trip ${tripId}`);
      return false;
    }

    // Check if this driver was notified
    const pendingTrip = this.driverPendingTrips.get(driverId);
    if (pendingTrip !== tripId) {
      logger.warn(`Driver ${driverId} was not notified for trip ${tripId}`);
      return false;
    }

    // Try to assign driver
    const trip = await tripService.assignDriverToTrip(tripId, driverId);
    if (!trip) {
      logger.warn(`Failed to assign driver ${driverId} to trip ${tripId}`);
      return false;
    }

    // Clean up
    this.driverPendingTrips.delete(driverId);
    this.emit('driver_accepted', { tripId, driverId });

    return true;
  }

  /**
   * Handle driver rejection
   */
  async driverReject(tripId: string, driverId: string): Promise<void> {
    const session = this.activeSessions.get(tripId);
    if (!session) return;

    // Add to rejected list
    await tripService.addDriverToRejected(tripId, driverId);
    this.driverPendingTrips.delete(driverId);

    this.emit('driver_rejected', { tripId, driverId });
    logger.info(`Driver ${driverId} rejected trip ${tripId}`);
  }

  /**
   * Handle driver accepted event
   */
  private handleDriverAccepted({
    tripId,
    driverId,
  }: {
    tripId: string;
    driverId: string;
  }): void {
    const session = this.activeSessions.get(tripId);
    if (!session) return;

    // Clear timeout
    if (session.timeout) {
      clearTimeout(session.timeout);
    }

    // Resolve promise
    if (session.resolvePromise) {
      session.resolvePromise({
        success: true,
        tripId,
        driverId,
        message: 'Driver found',
        messageAr: 'تم العثور على سائق',
      });
    }

    // Remove session
    this.activeSessions.delete(tripId);

    // Clean up pending trips for other drivers
    for (const [driver, trip] of this.driverPendingTrips.entries()) {
      if (trip === tripId && driver !== driverId) {
        this.driverPendingTrips.delete(driver);
      }
    }

    logger.info(`Trip ${tripId} matched with driver ${driverId}`);
  }

  /**
   * Handle driver rejected event
   */
  private handleDriverRejected({
    tripId,
  }: {
    tripId: string;
    driverId: string;
  }): void {
    // Already handled in searchNextBatch timeout
    logger.debug(`Driver rejected trip ${tripId}`);
  }

  /**
   * Handle driver timeout event
   */
  private handleDriverTimeout({
    tripId,
  }: {
    tripId: string;
    driverId: string;
  }): void {
    // Already handled in searchNextBatch timeout
    logger.debug(`Driver timed out for trip ${tripId}`);
  }

  /**
   * Handle no drivers available
   */
  private async handleNoDrivers(tripId: string): Promise<void> {
    const session = this.activeSessions.get(tripId);
    if (!session) return;

    // Clear timeout
    if (session.timeout) {
      clearTimeout(session.timeout);
    }

    // Cancel trip
    await tripService.cancelTrip(tripId, 'system', 'No drivers available');

    // Resolve promise
    if (session.resolvePromise) {
      session.resolvePromise({
        success: false,
        tripId,
        message: 'No drivers available in your area',
        messageAr: 'لا يوجد سائقين متاحين في منطقتك',
      });
    }

    // Remove session
    this.activeSessions.delete(tripId);
    this.emit('no_drivers', { tripId });

    logger.info(`No drivers found for trip ${tripId}`);
  }

  /**
   * Handle match timeout
   */
  private async handleMatchTimeout(tripId: string): Promise<void> {
    const session = this.activeSessions.get(tripId);
    if (!session) return;

    // Cancel trip
    await tripService.cancelTrip(tripId, 'system', 'Search timeout');

    // Resolve promise
    if (session.resolvePromise) {
      session.resolvePromise({
        success: false,
        tripId,
        message: 'Could not find a driver. Please try again.',
        messageAr: 'لم نتمكن من إيجاد سائق. يرجى المحاولة مرة أخرى.',
      });
    }

    // Remove session
    this.activeSessions.delete(tripId);
    this.emit('match_timeout', { tripId });

    logger.info(`Matching timeout for trip ${tripId}`);
  }

  /**
   * Cancel matching for a trip
   */
  async cancelMatching(tripId: string): Promise<void> {
    const session = this.activeSessions.get(tripId);
    if (!session) return;

    // Clear timeout
    if (session.timeout) {
      clearTimeout(session.timeout);
    }

    // Clean up pending trips
    for (const [driver, trip] of this.driverPendingTrips.entries()) {
      if (trip === tripId) {
        this.driverPendingTrips.delete(driver);
      }
    }

    // Remove session
    this.activeSessions.delete(tripId);

    logger.info(`Matching cancelled for trip ${tripId}`);
  }

  /**
   * Get active session for a trip
   */
  getSession(tripId: string): MatchingSession | undefined {
    return this.activeSessions.get(tripId);
  }

  /**
   * Check if driver has pending trip
   */
  getDriverPendingTrip(driverId: string): string | undefined {
    return this.driverPendingTrips.get(driverId);
  }

  /**
   * Get matching stats
   */
  getStats(): {
    activeSessions: number;
    pendingDrivers: number;
  } {
    return {
      activeSessions: this.activeSessions.size,
      pendingDrivers: this.driverPendingTrips.size,
    };
  }
}

// Create singleton instance
const matchingManager = new MatchingManager();

// Export functions
export const startMatching = (trip: ITrip) => matchingManager.startMatching(trip);
export const driverAccept = (tripId: string, driverId: string) =>
  matchingManager.driverAccept(tripId, driverId);
export const driverReject = (tripId: string, driverId: string) =>
  matchingManager.driverReject(tripId, driverId);
export const cancelMatching = (tripId: string) => matchingManager.cancelMatching(tripId);
export const getMatchingSession = (tripId: string) => matchingManager.getSession(tripId);
export const getDriverPendingTrip = (driverId: string) =>
  matchingManager.getDriverPendingTrip(driverId);
export const getMatchingStats = () => matchingManager.getStats();
export const matchingEvents = matchingManager;

export default {
  startMatching,
  driverAccept,
  driverReject,
  cancelMatching,
  getMatchingSession,
  getDriverPendingTrip,
  getMatchingStats,
  matchingEvents,
};
