import * as React from 'react';
import { setRequestLocale } from 'next-intl/server';
import { Clock } from 'lucide-react';
import { EmptyState } from '@wasalni/ui';
import type { Locale } from '@wasalni/i18n';

export default async function PendingApprovalPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);
  const ar = locale === 'ar';

  return (
    <EmptyState
      icon={<Clock className="h-6 w-6" aria-hidden="true" />}
      title={ar ? 'حسابك تحت المراجعة' : 'Your account is under review'}
      description={
        ar
          ? 'فريقنا بيراجع طلبك والمستندات. هتستلم إشعار خلال 24 ساعة. ممكن تقفل الصفحة وترجع لما يوصلك الرد.'
          : "Our team is reviewing your application and documents. You'll get a notification within 24 hours. Feel free to close this page and come back when you hear from us."
      }
    />
  );
}
