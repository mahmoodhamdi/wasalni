'use client';

import * as React from 'react';
import toast from 'react-hot-toast';
import { BellOff, BellRing } from 'lucide-react';
import { Button, Badge } from '@wasalni/ui';
import { useAuth } from '@wasalni/auth/react';
import { useFcm, type FirebaseConfig } from '@wasalni/pwa';
import type { Locale } from '@wasalni/i18n';

interface Props {
  locale: Locale;
}

function readConfig(): FirebaseConfig | null {
  const env = process.env;
  const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const messagingSenderId = env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const vapidKey = env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!apiKey || !projectId || !messagingSenderId || !appId || !vapidKey) return null;
  return {
    apiKey,
    projectId,
    messagingSenderId,
    appId,
    vapidKey,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? `${projectId}.firebaseapp.com`,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? `${projectId}.appspot.com`,
  };
}

export function NotificationsCard({ locale }: Props): React.ReactElement {
  const config = React.useMemo(() => readConfig(), []);
  const fcm = useFcm(config);
  const { fetcher } = useAuth();
  const [registering, setRegistering] = React.useState(false);
  const ar = locale === 'ar';

  const enable = async () => {
    setRegistering(true);
    try {
      const token = await fcm.request();
      if (!token) {
        if (fcm.permission === 'denied') {
          toast.error(
            ar
              ? 'الإشعارات متوقفة من المتصفح. فعّلها من إعدادات الموقع.'
              : 'Notifications are blocked. Enable them from the browser site settings.',
          );
        } else if (fcm.error === 'not-supported') {
          toast.error(ar ? 'متصفحك مش بيدعم الإشعارات' : 'Your browser does not support push');
        }
        return;
      }
      const res = await fetcher('/api/auth/fcm-token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, platform: 'web' }),
      });
      if (!res.ok) {
        toast.error(ar ? 'تعذّر التسجيل' : 'Could not register');
        return;
      }
      toast.success(ar ? 'تم تفعيل الإشعارات' : 'Notifications enabled');
    } finally {
      setRegistering(false);
    }
  };

  if (!config) {
    return (
      <div className="space-y-2">
        <Badge variant="warning">{ar ? 'غير مفعّل' : 'Not configured'}</Badge>
        <p className="text-sm text-[var(--color-fg-muted)]">
          {ar
            ? 'الإشعارات هتشتغل لما الفريق يضيف مفاتيح Firebase. هتستلم على الأقل إشعار داخل التطبيق.'
            : 'Push notifications will work once Firebase keys are wired up. In-app notifications still work.'}
        </p>
      </div>
    );
  }

  if (!fcm.isSupported) {
    return (
      <div className="space-y-2">
        <Badge variant="neutral">{ar ? 'غير متاح' : 'Unsupported'}</Badge>
        <p className="text-sm text-[var(--color-fg-muted)]">
          {ar
            ? 'متصفحك مش بيدعم الإشعارات. جرّب Chrome أو Edge أو ثبّت التطبيق على Safari iOS.'
            : 'This browser does not support push. Try Chrome or Edge or install on iOS Safari.'}
        </p>
      </div>
    );
  }

  if (fcm.token) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-[var(--color-success-500)]" aria-hidden="true" />
          <span className="text-sm">
            {ar ? 'الإشعارات مفعّلة على الجهاز ده' : 'Notifications are enabled on this device'}
          </span>
        </div>
      </div>
    );
  }

  if (fcm.permission === 'denied') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BellOff className="h-5 w-5 text-[var(--color-danger-500)]" aria-hidden="true" />
          <span className="text-sm">
            {ar
              ? 'الإشعارات متوقفة. فعّلها من إعدادات المتصفح.'
              : 'Notifications are blocked. Enable them in browser site settings.'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--color-fg-muted)]">
        {ar
          ? 'ابقى متابع حالة الرحلة وعروض الخصم والإشعارات الأمنية.'
          : 'Get trip updates, promos, and safety alerts.'}
      </p>
      <Button type="button" onClick={enable} isLoading={registering || fcm.loading}>
        <BellRing className="h-4 w-4" aria-hidden="true" />
        {ar ? 'تفعيل الإشعارات' : 'Enable notifications'}
      </Button>
    </div>
  );
}
