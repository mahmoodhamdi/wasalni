'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

/**
 * Thin wrapper over next-themes. We default to system theme and persist the
 * choice under `wasalni.theme`. Avoids the "flash of wrong theme" by setting
 * the `class` attribute on <html> before hydration via next-themes' script.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps): React.ReactNode {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="wasalni.theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
