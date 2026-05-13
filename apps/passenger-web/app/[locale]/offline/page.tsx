import * as React from 'react';
import { setRequestLocale } from 'next-intl/server';
import { WifiOff } from 'lucide-react';
import { EmptyState } from '@wasalni/ui';
import type { Locale } from '@wasalni/i18n';

export const dynamic = 'force-static';

export default async function OfflinePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);
  const ar = locale === 'ar';

  return (
    <EmptyState
      icon={<WifiOff className="h-6 w-6" aria-hidden="true" />}
      title={ar ? 'لا يوجد اتصال بالإنترنت' : 'You are offline'}
      description={
        ar
          ? 'مفيش اتصال دلوقتي. اللي خزّناه قبل كده هتلاقيه شغال، باقي الصفحات هترجع لما الإنترنت يرجع.'
          : 'No internet right now. Cached pages still work; everything else will return when you reconnect.'
      }
    />
  );
}
