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

const driverFormSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().trim().email().optional().or(z.literal('')),
  gender: z.enum(['male', 'female']),
  nationalId: z
    .string()
    .trim()
    .regex(/^\d{14}$/),
  vehicleType: z.enum(['economy', 'comfort', 'family', 'tuktuk', 'motorcycle']),
  vehicleMake: z.string().trim().min(1).max(40),
  vehicleModel: z.string().trim().min(1).max(40),
  vehicleYear: z
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1),
  vehicleColor: z.string().trim().min(1).max(20),
  vehiclePlate: z.string().trim().min(1).max(20),
});

type FormValues = z.infer<typeof driverFormSchema>;

interface Props {
  locale: Locale;
  phone: string;
  otp: string;
  brand: string;
}

const VEHICLE_TYPES = [
  ['economy', { ar: 'اقتصادي', en: 'Economy' }],
  ['comfort', { ar: 'مريح', en: 'Comfort' }],
  ['family', { ar: 'عائلي', en: 'Family' }],
  ['tuktuk', { ar: 'توك توك', en: 'Tuk-tuk' }],
  ['motorcycle', { ar: 'موتوسيكل', en: 'Motorcycle' }],
] as const;

export function DriverRegisterForm({ locale, phone, otp }: Props): React.ReactElement {
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      name: '',
      email: '',
      gender: 'male',
      nationalId: '',
      vehicleType: 'economy',
      vehicleMake: '',
      vehicleModel: '',
      vehicleYear: new Date().getFullYear(),
      vehicleColor: '',
      vehiclePlate: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const body: Record<string, unknown> = {
        phone,
        otp,
        name: values.name,
        gender: values.gender,
        nationalId: values.nationalId,
        vehicleType: values.vehicleType,
        vehicle: {
          make: values.vehicleMake,
          model: values.vehicleModel,
          year: values.vehicleYear,
          color: values.vehicleColor,
          plateNumber: values.vehiclePlate,
        },
      };
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
      toast.success(locale === 'ar' ? 'تم تسجيل الحساب بنجاح' : 'Registration submitted');
      router.replace(`/${locale}/auth/pending`);
    } catch {
      toast.error(tErrors('network'));
    }
  });

  const label = (ar: string, en: string) => (locale === 'ar' ? ar : en);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="name"
          label={label('اسمك', 'Full name')}
          required
          error={errors.name ? tCommon('confirm') : undefined}
        >
          {(slot) => (
            <Input {...slot} autoComplete="name" invalid={!!errors.name} {...register('name')} />
          )}
        </FormField>
        <FormField id="email" label={label('بريد إلكتروني (اختياري)', 'Email (optional)')}>
          {(slot) => (
            <Input
              {...slot}
              type="email"
              dir="ltr"
              autoComplete="email"
              invalid={!!errors.email}
              {...register('email')}
            />
          )}
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="gender" label={label('النوع', 'Gender')} required>
          {(slot) => (
            <select
              {...slot}
              {...register('gender')}
              className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2"
            >
              <option value="male">{label('ذكر', 'Male')}</option>
              <option value="female">{label('أنثى', 'Female')}</option>
            </select>
          )}
        </FormField>
        <FormField
          id="nationalId"
          label={label('الرقم القومي', 'National ID')}
          required
          description={label('14 رقم', '14 digits')}
          error={errors.nationalId ? label('غير صحيح', 'Invalid') : undefined}
        >
          {(slot) => (
            <Input
              {...slot}
              inputMode="numeric"
              dir="ltr"
              maxLength={14}
              invalid={!!errors.nationalId}
              {...register('nationalId')}
            />
          )}
        </FormField>
      </div>

      <FormField id="vehicleType" label={label('نوع السيارة', 'Vehicle type')} required>
        {(slot) => (
          <select
            {...slot}
            {...register('vehicleType')}
            className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2"
          >
            {VEHICLE_TYPES.map(([key, labels]) => (
              <option key={key} value={key}>
                {labels[locale]}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <fieldset className="space-y-4 rounded-lg border border-[var(--color-border)] p-4">
        <legend className="px-2 text-sm font-medium">
          {label('بيانات السيارة', 'Vehicle details')}
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="vehicleMake" label={label('الماركة', 'Make')} required>
            {(slot) => (
              <Input
                {...slot}
                placeholder={label('تويوتا، نيسان، …', 'Toyota, Nissan, …')}
                invalid={!!errors.vehicleMake}
                {...register('vehicleMake')}
              />
            )}
          </FormField>
          <FormField id="vehicleModel" label={label('الموديل', 'Model')} required>
            {(slot) => (
              <Input
                {...slot}
                placeholder={label('كورولا، صني، …', 'Corolla, Sunny, …')}
                invalid={!!errors.vehicleModel}
                {...register('vehicleModel')}
              />
            )}
          </FormField>
          <FormField id="vehicleYear" label={label('السنة', 'Year')} required>
            {(slot) => (
              <Input
                {...slot}
                inputMode="numeric"
                dir="ltr"
                invalid={!!errors.vehicleYear}
                {...register('vehicleYear', { valueAsNumber: true })}
              />
            )}
          </FormField>
          <FormField id="vehicleColor" label={label('اللون', 'Colour')} required>
            {(slot) => (
              <Input {...slot} invalid={!!errors.vehicleColor} {...register('vehicleColor')} />
            )}
          </FormField>
          <FormField
            id="vehiclePlate"
            label={label('لوحة السيارة', 'Plate number')}
            required
            className="sm:col-span-2"
          >
            {(slot) => (
              <Input {...slot} invalid={!!errors.vehiclePlate} {...register('vehiclePlate')} />
            )}
          </FormField>
        </div>
      </fieldset>

      <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
        {tCommon('submit')}
      </Button>
      <p className="text-xs text-[var(--color-fg-muted)]">
        {label(
          'هتحتاج ترفع المستندات (الرقم القومي، الرخصة، استمارة العربية) بعد التسجيل من شاشة الانتظار.',
          'Upload documents (national ID, licence, registration) from the pending screen after registration.',
        )}
      </p>
    </form>
  );
}
