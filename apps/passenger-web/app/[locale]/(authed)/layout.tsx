import * as React from 'react';
import { redirect } from 'next/navigation';
import { UnauthorizedError, AuthEndpoints } from '@wasalni/api-client';
import type { Locale } from '@wasalni/i18n';
import { backend } from '../../../lib/server/backend';

/**
 * Authenticated layout: redirects to /[locale]/auth/login when the
 * session cookie is missing or invalid. The server-side cookie probe
 * happens via the shared backend client (reads SESSION_COOKIE).
 */
export default async function AuthedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}): Promise<React.ReactNode> {
  const { locale } = await params;
  try {
    await new AuthEndpoints(backend).me();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      redirect(`/${locale}/auth/login`);
    }
    // For any other error (network etc.), let the page render and surface
    // the error via the React Query loaders downstream.
  }
  return <>{children}</>;
}
