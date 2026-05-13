'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { localeLabels, locales, type Locale } from '@wasalni/i18n';
import { Button } from '@wasalni/ui';

export function LocaleSwitcher(): React.ReactElement {
  const current = useLocale() as Locale;
  const t = useTranslations('locale');
  const router = useRouter();
  const pathname = usePathname();
  const next: Locale = current === 'ar' ? 'en' : 'ar';

  const handleClick = React.useCallback(() => {
    const segments = pathname.split('/');
    if (segments[1] && (locales as readonly string[]).includes(segments[1])) {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }
    router.replace(segments.join('/') || `/${next}`);
  }, [pathname, next, router]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      aria-label={t('switchTo', { label: localeLabels[next] })}
    >
      <Globe className="h-4 w-4 me-1.5" aria-hidden="true" />
      <span className="font-medium">{localeLabels[next]}</span>
    </Button>
  );
}
