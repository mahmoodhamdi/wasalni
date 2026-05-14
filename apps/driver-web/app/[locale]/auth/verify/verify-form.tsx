'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button, OtpInput } from '@wasalni/ui';
import type { Locale } from '@wasalni/i18n';
import { useAuthStore } from '@wasalni/auth/react';
import type { WasalniUser } from '@wasalni/auth/react';

interface VerifyFormProps {
  locale: Locale;
  phone: string;
  nextPath: string;
}

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export function VerifyForm({ locale, phone, nextPath }: VerifyFormProps): React.ReactElement {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [value, setValue] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [invalid, setInvalid] = React.useState(false);
  const [resendIn, setResendIn] = React.useState(RESEND_SECONDS);
  const [resending, setResending] = React.useState(false);

  React.useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const submit = React.useCallback(
    async (otp: string) => {
      if (submitting) return;
      setSubmitting(true);
      setInvalid(false);
      try {
        const res = await fetch('/api/auth/otp/verify', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ phone, otp }),
        });
        if (res.status === 404) {
          // No account yet — backend signals 404 on verify; redirect to register.
          const params = new URLSearchParams({ phone, otp, next: nextPath });
          router.push(`/${locale}/auth/register?${params.toString()}`);
          return;
        }
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          setInvalid(true);
          toast.error(body?.error ?? t('wrongOtp'));
          return;
        }
        const body = (await res.json()) as {
          data: { user: WasalniUser };
        };
        setUser(body.data.user);
        router.replace(nextPath);
      } catch {
        toast.error(tErrors('network'));
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, phone, locale, nextPath, router, setUser, t, tErrors],
  );

  const resend = async () => {
    if (resending || resendIn > 0) return;
    setResending(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(body?.error ?? tErrors('generic'));
        return;
      }
      setResendIn(RESEND_SECONDS);
      toast.success(t('otpSent', { phone }));
    } catch {
      toast.error(tErrors('network'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <OtpInput
        length={OTP_LENGTH}
        value={value}
        onChange={setValue}
        onComplete={submit}
        disabled={submitting}
        invalid={invalid}
        autoFocus
        aria-label={t('enterOtp')}
      />
      <Button
        type="button"
        size="lg"
        fullWidth
        isLoading={submitting}
        disabled={value.length < OTP_LENGTH}
        onClick={() => submit(value)}
      >
        {tCommon('confirm')}
      </Button>
      <div className="text-center text-sm">
        {resendIn > 0 ? (
          <span className="text-[var(--color-fg-muted)]">
            {t('resendIn', { seconds: resendIn })}
          </span>
        ) : (
          <button
            type="button"
            onClick={resend}
            disabled={resending}
            className="text-[var(--color-brand-600)] hover:underline disabled:opacity-50"
          >
            {t('resendOtp')}
          </button>
        )}
      </div>
    </div>
  );
}
