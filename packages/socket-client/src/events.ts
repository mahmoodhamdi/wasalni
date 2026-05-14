/**
 * Typed socket.io event map for the Wasalni real-time layer.
 *
 * Mirrors `backend/src/config/socket.ts` and `backend/src/sockets/trip.socket.ts`.
 * Keep this file in sync with the backend; the contract is checked at build
 * time via the typed `Socket<ServerToClient, ClientToServer>` generic.
 */

import type { TripStatus } from '@wasalni/shared-types';

export interface DriverLocationUpdate {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  updatedAt: Date | string;
}

export interface DriverStatusChanged {
  driverId: string;
  status: 'online' | 'offline' | 'busy';
  updatedAt: Date | string;
}

export interface TripStatusEvent {
  tripId: string;
  status: TripStatus;
  at: Date | string;
}

export interface IncomingRideRequest {
  tripId: string;
  passenger: {
    id: string;
    name: string;
    rating?: number;
    phone?: string;
  };
  pickup: { latitude: number; longitude: number; address: string };
  dropoff: { latitude: number; longitude: number; address: string };
  estimatedFare: number;
  estimatedDistance: number;
  estimatedDuration: number;
  /** Seconds the driver has to accept. */
  expiresIn: number;
}

export interface ChatMessage {
  id: string;
  tripId: string;
  from: 'passenger' | 'driver' | 'system';
  text: string;
  at: Date | string;
}

export interface SosEvent {
  tripId?: string;
  userId: string;
  role: 'passenger' | 'driver';
  coords: { latitude: number; longitude: number };
  reason: string;
  at: Date | string;
}

/**
 * Events the SERVER emits to the CLIENT.
 */
export interface ServerToClientEvents {
  'driver:location:update': (e: DriverLocationUpdate) => void;
  'driver:status:changed': (e: DriverStatusChanged) => void;
  'trip:status': (e: TripStatusEvent) => void;
  'trip:request': (e: IncomingRideRequest) => void;
  'trip:request:cancelled': (e: { tripId: string }) => void;
  'trip:chat': (e: ChatMessage) => void;
  'sos:triggered': (e: SosEvent) => void;
  connect: () => void;
  disconnect: (reason: string) => void;
  error: (err: { message: string }) => void;
}

/**
 * Events the CLIENT emits to the SERVER.
 */
export interface ClientToServerEvents {
  'join:user': (userId: string) => void;
  'join:driver': (data: { driverId: string; latitude?: number; longitude?: number }) => void;
  'leave:driver': (driverId: string) => void;
  'join:trip': (tripId: string) => void;
  'leave:trip': (tripId: string) => void;
  'driver:location': (data: {
    driverId: string;
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  }) => void;
  'driver:status': (data: { driverId: string; status: 'online' | 'offline' | 'busy' }) => void;
  'trip:chat:send': (data: { tripId: string; text: string }) => void;
}
