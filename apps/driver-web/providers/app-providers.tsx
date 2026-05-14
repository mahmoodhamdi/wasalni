'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@wasalni/auth/react';
import { SocketProvider } from '@wasalni/socket-client/react';
import { ThemeProvider } from '../components/theme-provider';
import { InstallPrompt } from '../components/install-prompt';
import { SwUpdateBanner } from '../components/sw-update-banner';
import { ObservabilityMount } from '../components/observability-mount';
import { env } from '../lib/env';

export function AppProviders({ children }: { children: React.ReactNode }): React.ReactNode {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider url={env.socketUrl}>
          <ThemeProvider>
            <ObservabilityMount />
            <SwUpdateBanner />
            {children}
            <InstallPrompt />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--color-bg)',
                  color: 'var(--color-fg)',
                  border: '1px solid var(--color-border)',
                },
              }}
            />
          </ThemeProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
