import { describe, expect, it, vi } from 'vitest';

// We mock socket.io-client to capture the constructor args without
// opening a real socket.
vi.mock('socket.io-client', () => {
  return {
    io: vi.fn(() => ({ on: vi.fn(), off: vi.fn(), emit: vi.fn(), disconnect: vi.fn() })),
  };
});

import { io } from 'socket.io-client';
import { createSocket } from '../src/client';

describe('createSocket factory', () => {
  it('passes the URL through', () => {
    createSocket({ url: 'http://x.test' });
    expect(io).toHaveBeenCalledWith(
      'http://x.test',
      expect.objectContaining({ transports: ['websocket', 'polling'] }),
    );
  });

  it('attaches the auth handshake when a token is given', () => {
    createSocket({ url: 'http://x.test', token: 't-1' });
    const opts = (io as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[1] as {
      auth?: unknown;
    };
    expect(opts?.auth).toEqual({ token: 't-1' });
  });

  it('omits the auth field when no token', () => {
    createSocket({ url: 'http://x.test' });
    const opts = (io as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[1] as {
      auth?: unknown;
    };
    expect(opts?.auth).toBeUndefined();
  });

  it('uses cookies (withCredentials) by default', () => {
    createSocket({ url: 'http://x.test' });
    const opts = (io as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[1] as {
      withCredentials?: boolean;
    };
    expect(opts?.withCredentials).toBe(true);
  });

  it('respects autoConnect=false', () => {
    createSocket({ url: 'http://x.test', autoConnect: false });
    const opts = (io as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[1] as {
      autoConnect?: boolean;
    };
    expect(opts?.autoConnect).toBe(false);
  });
});
