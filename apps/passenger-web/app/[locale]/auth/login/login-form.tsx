'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Phone } from 'lucide-react';
import { z } from 'zod';
import { Button, FormField, Input } from '@wasalni/ui';
import { isValidEgPhone, normalizeEgPhone } from '@wasalni/utils/phone';
import type { Locale } from '@wasalni/i18n';

const loginFormSchema = z.object({
  phone: z.string().min(1).refine(isValidEgPhone, 'invalid'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

interface LoginFormProps {
  locale: Locale;
  nextPath: string;
}

export function LoginForm({ locale, nextPath }: LoginFormProps): React.ReactElement {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { phone: '' },
  });

  const onSubmit = handleSubmit(async ({ phone }) => {
    const normalized = normalizeEgPhone(phone);
    if (!normalized) {
      toast.error(t('phoneInvalid'));
      return;
    }
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: normalized.e164 }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(body?.error ?? tErrors('generic'));
        return;
      }
      const params = new URLSearchParams({ phone: normalized.e164, next: nextPath });
      router.push(`/${locale}/auth/verify?${params.toString()}`);
    } catch {
      toast.error(tErrors('network'));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormField
        id="phone"
        label={t('enterPhone')}
        error={errors.phone ? t('phoneInvalid') : undefined}
      >
        {(slot) => (
          <div className="relative">
            <Phone
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-[var(--color-fg-muted)]"
              aria-hidden="true"
            />
            <Input
              {...slot}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              placeholder="01XXXXXXXXX"
              className="ps-10"
              invalid={!!errors.phone}
              {...register('phone')}
            />
          </div>
        )}
      </FormField>
      <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
        {tCommon('next')}
      </Button>
    </form>
  );
}
