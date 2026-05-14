'use client';

import * as React from 'react';
import { createSocket, type WasalniSocket } from '../client';

interface SocketContextValue {
  socket: WasalniSocket | null;
  connected: boolean;
}

const SocketContext = React.createContext<SocketContextValue>({
  socket: null,
  connected: false,
});

export interface SocketProviderProps {
  url: string;
  /** Optional bearer token for the handshake (if not using cookies). */
  token?: string;
  /** Connect immediately on mount (default true). */
  autoConnect?: boolean;
  children: React.ReactNode;
}

/**
 * Wraps the children in a single socket.io connection. Connect on mount,
 * disconnect on unmount, broadcast connection state.
 */
export function SocketProvider({
  url,
  token,
  autoConnect = true,
  children,
}: SocketProviderProps): React.ReactElement {
  const [socket, setSocket] = React.useState<WasalniSocket | null>(null);
  const [connected, setConnected] = React.useState(false);

  React.useEffect(() => {
    const s = createSocket({ url, token, autoConnect });
    setSocket(s);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.disconnect();
    };
  }, [url, token, autoConnect]);

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>;
}

export function useSocket(): SocketContextValue {
  return React.useContext(SocketContext);
}
