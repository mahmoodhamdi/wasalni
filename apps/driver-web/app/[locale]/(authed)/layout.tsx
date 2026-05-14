import * as React from 'react';
import { redirect } from 'next/navigation';
import { UnauthorizedError, AuthEndpoints } from '@wasalni/api-client';
import type { Locale } from '@wasalni/i18n';
import { backend } from '../../../lib/server/backend';

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
  }
  return <>{children}</>;
}
