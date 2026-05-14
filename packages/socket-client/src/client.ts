import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from './events.js';

export type WasalniSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface CreateSocketOptions {
  url: string;
  /** Bearer token (passed via auth handshake) when not using cookies. */
  token?: string;
  /** Set false to skip auto-connect; caller does `.connect()` later. */
  autoConnect?: boolean;
  /** Force a transport for tests; defaults to websocket+polling fallback. */
  transports?: ('websocket' | 'polling')[];
  /** Reconnection params. socket.io defaults are fine; expose for tests. */
  reconnectionAttempts?: number;
}

/**
 * Factory for the typed socket.io-client. Single source of truth for
 * connection parameters across both apps.
 */
export function createSocket(options: CreateSocketOptions): WasalniSocket {
  return io(options.url, {
    autoConnect: options.autoConnect ?? true,
    transports: options.transports ?? ['websocket', 'polling'],
    auth: options.token ? { token: options.token } : undefined,
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: options.reconnectionAttempts ?? Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    timeout: 10_000,
  });
}
