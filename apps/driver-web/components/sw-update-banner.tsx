'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { RefreshCw } from 'lucide-react';
import { Button } from '@wasalni/ui';
import { useServiceWorkerUpdate } from '@wasalni/pwa';

/**
 * Top banner shown when a new service worker is waiting. Tapping
 * "Update" sends SKIP_WAITING to the SW; the controllerchange listener
 * inside useServiceWorkerUpdate reloads the page afterwards.
 */
export function SwUpdateBanner(): React.ReactElement | null {
  const { hasUpdate, apply, dismiss } = useServiceWorkerUpdate();
  const locale = useLocale();
  const [busy, setBusy] = React.useState(false);

  if (!hasUpdate) return null;

  const ar = locale === 'ar';
  const onApply = async () => {
    setBusy(true);
    await apply();
    // page will reload via controllerchange; if for any reason it doesn't,
    // fall back to manual reload after a short timeout.
    setTimeout(() => {
      setBusy(false);
      window.location.reload();
    }, 2000);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-14 z-40 mx-auto flex max-w-screen-xl items-center justify-between gap-3 border-b border-[var(--color-info-500)]/20 bg-[var(--color-info-500)]/10 px-4 py-2 text-sm sm:px-6"
    >
      <span className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-[var(--color-info-500)]" aria-hidden="true" />
        <span>
          {ar
            ? 'في إصدار جديد جاهز. حدّث علشان تستفيد منه.'
            : 'A new version is ready. Update to use it.'}
        </span>
      </span>
      <span className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
          {ar ? 'تجاهل' : 'Dismiss'}
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={onApply} isLoading={busy}>
          {ar ? 'حدّث' : 'Update'}
        </Button>
      </span>
    </div>
  );
}
