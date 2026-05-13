'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { Download, X } from 'lucide-react';
import { Button } from '@wasalni/ui';
import { useInstallPrompt } from '@wasalni/pwa';

/**
 * Bottom-sheet install nudge. Shown only when the browser fired
 * `beforeinstallprompt` (Chrome/Edge on Android, Edge on desktop). iOS
 * Safari requires manual "Add to Home Screen" — surfaced separately.
 */
export function InstallPrompt(): React.ReactElement | null {
  const { canInstall, install, dismiss, isStandalone } = useInstallPrompt();
  const locale = useLocale();
  const [busy, setBusy] = React.useState(false);

  if (isStandalone || !canInstall) return null;

  const ar = locale === 'ar';

  const onInstall = async () => {
    setBusy(true);
    try {
      await install();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-labelledby="install-title"
      className="fixed inset-x-2 bottom-2 z-50 mx-auto max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-4 shadow-[var(--shadow-overlay)] sm:inset-x-auto sm:end-4 sm:bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
          <Download className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p id="install-title" className="font-medium">
            {ar ? 'أضف وصلني للشاشة الرئيسية' : 'Install Wasalni'}
          </p>
          <p className="mt-0.5 text-sm text-[var(--color-fg-muted)]">
            {ar
              ? 'أسرع وأخف من فتح المتصفح كل مرة.'
              : 'Faster than opening the browser every time.'}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={dismiss}
          aria-label={ar ? 'إغلاق' : 'Close'}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
          {ar ? 'لاحقاً' : 'Later'}
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={onInstall} isLoading={busy}>
          {ar ? 'تثبيت' : 'Install'}
        </Button>
      </div>
    </div>
  );
}
