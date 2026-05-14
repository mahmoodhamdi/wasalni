'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Bell, User, Mail, Phone, LogOut } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
} from '@wasalni/ui';
import { useAuth, useAuthStore } from '@wasalni/auth/react';
import type { WasalniUser } from '@wasalni/auth/react';
import { formatEgPhoneDisplay } from '@wasalni/utils/phone';
import type { Locale } from '@wasalni/i18n';
import { NotificationsCard } from './notifications-card';

const formSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().trim().email().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  locale: Locale;
}

export function ProfileScreen({ locale }: Props): React.ReactElement {
  const { user, fetcher, logout } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const ar = locale === 'ar';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
    },
  });

  React.useEffect(() => {
    if (user) {
      reset({ name: user.name, email: user.email ?? '' });
    }
  }, [user, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const body: Record<string, unknown> = { name: values.name };
    if (values.email) body.email = values.email;
    const res = await fetcher('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const b = (await res.json().catch(() => null)) as { error?: string } | null;
      toast.error(b?.error ?? (ar ? 'تعذّر الحفظ' : 'Could not save'));
      return;
    }
    const j = (await res.json()) as {
      data: WasalniUser;
    };
    setUser(j.data);
    toast.success(ar ? 'تم الحفظ' : 'Saved');
  });

  if (!user) return <div className="py-10 text-center">…</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4 py-4">
      <header>
        <h1 className="text-2xl font-bold">{ar ? 'الملف الشخصي' : 'Profile'}</h1>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-xl font-bold text-[var(--color-brand-700)]">
              {user.name.slice(0, 1)}
            </div>
            <div>
              <CardTitle>{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-1.5 mt-0.5">
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                <span dir="ltr">{formatEgPhoneDisplay(user.phone)}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <User className="h-5 w-5" aria-hidden="true" />
              {ar ? 'البيانات الشخصية' : 'Personal info'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <FormField
              id="name"
              label={ar ? 'الاسم' : 'Name'}
              error={errors.name ? '!' : undefined}
            >
              {(slot) => <Input {...slot} invalid={!!errors.name} {...register('name')} />}
            </FormField>
            <FormField
              id="email"
              label={ar ? 'بريد إلكتروني' : 'Email'}
              error={errors.email ? 'Invalid' : undefined}
            >
              {(slot) => (
                <Input
                  {...slot}
                  type="email"
                  dir="ltr"
                  invalid={!!errors.email}
                  {...register('email')}
                />
              )}
            </FormField>
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1 text-xs text-[var(--color-fg-muted)]">
                <Mail className="h-3 w-3" aria-hidden="true" />
                {ar ? 'لإرسال الإيصالات والإشعارات' : 'For receipts and notifications'}
              </p>
              <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
                {ar ? 'حفظ' : 'Save'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Bell className="h-5 w-5" aria-hidden="true" />
              {ar ? 'الإشعارات' : 'Notifications'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationsCard locale={locale} />
        </CardContent>
      </Card>

      <Button
        type="button"
        variant="outline"
        size="lg"
        fullWidth
        onClick={() => logout().then(() => (window.location.href = `/${locale}`))}
      >
        <LogOut className="h-5 w-5" aria-hidden="true" />
        {ar ? 'تسجيل خروج' : 'Log out'}
      </Button>
    </div>
  );
}
