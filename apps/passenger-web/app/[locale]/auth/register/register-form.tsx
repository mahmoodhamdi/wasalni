'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { Button, FormField, Input } from '@wasalni/ui';
import { useAuthStore } from '@wasalni/auth/react';
import type { WasalniUser } from '@wasalni/auth/react';
import type { Locale } from '@wasalni/i18n';

const formSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().trim().email().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface RegisterFormProps {
  locale: Locale;
  phone: string;
  otp: string;
  nextPath: string;
}

export function RegisterForm({ phone, otp, nextPath }: RegisterFormProps): React.ReactElement {
  const tReg = useTranslations('register');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const body: Record<string, unknown> = { phone, otp, name: values.name };
      if (values.email) body.email = values.email;
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(j?.error ?? tErrors('generic'));
        return;
      }
      const j = (await res.json()) as {
        data: { user: WasalniUser };
      };
      setUser(j.data.user);
      toast.success(tReg('welcome'));
      router.replace(nextPath);
    } catch {
      toast.error(tErrors('network'));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormField
        id="name"
        label={tReg('name')}
        required
        error={errors.name ? tCommon('confirm') : undefined}
      >
        {(slot) => (
          <Input
            {...slot}
            autoComplete="name"
            placeholder={tReg('namePlaceholder')}
            invalid={!!errors.name}
            {...register('name')}
          />
        )}
      </FormField>
      <FormField
        id="email"
        label={tReg('email')}
        description={tReg('emailHelp')}
        error={errors.email ? 'Email invalid' : undefined}
      >
        {(slot) => (
          <Input
            {...slot}
            type="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            invalid={!!errors.email}
            {...register('email')}
          />
        )}
      </FormField>
      <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
        {tCommon('submit')}
      </Button>
    </form>
  );
}
