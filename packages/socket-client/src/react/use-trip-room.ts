'use client';

import * as React from 'react';
import type { TripStatus } from '@wasalni/shared-types';
import type { ChatMessage, DriverLocationUpdate, TripStatusEvent } from '../events';
import { useSocket } from './use-socket';

export interface TripRoomState {
  /** Latest trip status from the server. */
  status: TripStatus | null;
  /** Latest driver location, if it has been broadcast. */
  driverLocation: DriverLocationUpdate | null;
  /** Trip chat history this session. */
  messages: ChatMessage[];
  /** Connection state of the underlying socket. */
  connected: boolean;
  /** Send a chat message to the trip room. */
  sendMessage: (text: string) => void;
}

/**
 * Joins the `trip:<tripId>` room on connect, leaves on cleanup. Aggregates
 * status, driver location, and chat into a single React state object so
 * consumers don't need to wire up listeners themselves.
 */
export function useTripRoom(tripId: string | null): TripRoomState {
  const { socket, connected } = useSocket();

  const [status, setStatus] = React.useState<TripStatus | null>(null);
  const [driverLocation, setDriverLocation] = React.useState<DriverLocationUpdate | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);

  React.useEffect(() => {
    if (!socket || !tripId) return;

    const joinTrip = () => socket.emit('join:trip', tripId);

    if (connected) {
      joinTrip();
    } else {
      socket.on('connect', joinTrip);
    }

    const onStatus = (e: TripStatusEvent) => {
      if (e.tripId === tripId) setStatus(e.status);
    };
    const onLocation = (e: DriverLocationUpdate) => {
      setDriverLocation(e);
    };
    const onChat = (e: ChatMessage) => {
      if (e.tripId === tripId) {
        setMessages((prev) => [...prev, e]);
      }
    };

    socket.on('trip:status', onStatus);
    socket.on('driver:location:update', onLocation);
    socket.on('trip:chat', onChat);

    return () => {
      socket.off('connect', joinTrip);
      socket.off('trip:status', onStatus);
      socket.off('driver:location:update', onLocation);
      socket.off('trip:chat', onChat);
      socket.emit('leave:trip', tripId);
    };
  }, [socket, connected, tripId]);

  const sendMessage = React.useCallback(
    (text: string) => {
      if (!socket || !tripId || !text.trim()) return;
      socket.emit('trip:chat:send', { tripId, text: text.trim() });
    },
    [socket, tripId],
  );

  return { status, driverLocation, messages, connected, sendMessage };
}
