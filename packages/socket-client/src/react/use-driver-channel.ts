'use client';

import * as React from 'react';
import type { IncomingRideRequest } from '../events';
import { useSocket } from './use-socket';

export interface DriverChannelState {
  /** The currently displayed ride request, or null if none. */
  pendingRequest: IncomingRideRequest | null;
  /** Clear the pending request (e.g. after user accepts/declines). */
  clearRequest: () => void;
}

/**
 * Subscribes the connected driver socket to incoming ride requests.
 * Callers wrap this with the driver-online effect and an accept/decline
 * UI. The first request that arrives while a previous one is still
 * pending is dropped — drivers should see one request at a time.
 */
export function useDriverChannel(driverId: string | null): DriverChannelState {
  const { socket, connected } = useSocket();
  const [pendingRequest, setPendingRequest] = React.useState<IncomingRideRequest | null>(null);

  React.useEffect(() => {
    if (!socket || !driverId) return;
    const join = () => socket.emit('join:driver', { driverId });
    if (connected) join();
    else socket.on('connect', join);

    const onRequest = (e: IncomingRideRequest) => {
      setPendingRequest((prev) => prev ?? e);
    };
    const onCancelled = (e: { tripId: string }) => {
      setPendingRequest((prev) => (prev?.tripId === e.tripId ? null : prev));
    };

    socket.on('trip:request', onRequest);
    socket.on('trip:request:cancelled', onCancelled);

    return () => {
      socket.off('connect', join);
      socket.off('trip:request', onRequest);
      socket.off('trip:request:cancelled', onCancelled);
      socket.emit('leave:driver', driverId);
    };
  }, [socket, connected, driverId]);

  const clearRequest = React.useCallback(() => setPendingRequest(null), []);

  return { pendingRequest, clearRequest };
}
