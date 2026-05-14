'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@wasalni/auth/react';
import { ThemeProvider } from '../components/theme-provider';

/**
 * Single root client-side provider tree. Wraps everything in the locale
 * layout that needs React Context. SSR is preserved because each provider
 * is mark `'use client'` but only hydrates its consumers.
 */
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
        <ThemeProvider>
          {children}
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
      </AuthProvider>
    </QueryClientProvider>
  );
}
