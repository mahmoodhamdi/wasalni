'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, UserPlus, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  FormField,
  Input,
  Spinner,
} from '@wasalni/ui';
import { useAuth } from '@wasalni/auth/react';
import { isValidEgPhone, formatEgPhoneDisplay } from '@wasalni/utils/phone';
import type { Locale } from '@wasalni/i18n';

interface Props {
  locale: Locale;
}

interface ContactRow {
  _id: string;
  name: string;
  phone: string;
  relationship: string;
}

const contactSchema = z.object({
  name: z.string().trim().min(1).max(40),
  phone: z.string().trim().refine(isValidEgPhone, 'invalid'),
  relationship: z.string().trim().min(1).max(30),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function SafetySettings({ locale }: Props): React.ReactElement {
  const { fetcher } = useAuth();
  const queryClient = useQueryClient();
  const ar = locale === 'ar';

  const contacts = useQuery<ContactRow[]>({
    queryKey: ['safety-contacts'],
    queryFn: async () => {
      const res = await fetcher('/api/safety/contacts', { credentials: 'include' });
      if (!res.ok) throw new Error('failed');
      const body = (await res.json()) as { data: ContactRow[] };
      return body.data ?? [];
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', phone: '', relationship: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    const res = await fetcher('/api/safety/contacts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const b = (await res.json().catch(() => null)) as { error?: string } | null;
      toast.error(b?.error ?? (ar ? 'تعذّر الحفظ' : 'Could not save'));
      return;
    }
    toast.success(ar ? 'تم إضافة الرقم' : 'Contact added');
    reset({ name: '', phone: '', relationship: '' });
    queryClient.invalidateQueries({ queryKey: ['safety-contacts'] });
  });

  const removeContact = async (id: string) => {
    if (!window.confirm(ar ? 'متأكد إنك عاوز تشيله؟' : 'Remove this contact?')) return;
    const res = await fetcher(`/api/safety/contacts/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error(ar ? 'تعذّر الحذف' : 'Could not delete');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['safety-contacts'] });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 py-4">
      <header>
        <h1 className="text-2xl font-bold">{ar ? 'الأمان' : 'Safety'}</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          {ar
            ? 'أرقام طوارئ هتتنبه لو ضغطت زر SOS أثناء الرحلة'
            : 'Emergency contacts get notified when you trigger SOS during a trip'}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" aria-hidden="true" />
              {ar ? 'إضافة جهة اتصال' : 'Add contact'}
            </span>
          </CardTitle>
          <CardDescription>{ar ? 'حتى 5 جهات اتصال' : 'Up to 5 contacts'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-3">
            <FormField
              id="contact-name"
              label={ar ? 'الاسم' : 'Name'}
              error={errors.name ? '!' : undefined}
            >
              {(slot) => <Input {...slot} invalid={!!errors.name} {...register('name')} />}
            </FormField>
            <FormField
              id="contact-phone"
              label={ar ? 'موبايل' : 'Phone'}
              error={errors.phone ? '!' : undefined}
            >
              {(slot) => (
                <Input
                  {...slot}
                  type="tel"
                  dir="ltr"
                  placeholder="01XXXXXXXXX"
                  invalid={!!errors.phone}
                  {...register('phone')}
                />
              )}
            </FormField>
            <FormField
              id="contact-rel"
              label={ar ? 'الصلة' : 'Relationship'}
              error={errors.relationship ? '!' : undefined}
            >
              {(slot) => (
                <Input
                  {...slot}
                  placeholder={ar ? 'أب، أم، صديق…' : 'Father, Friend…'}
                  invalid={!!errors.relationship}
                  {...register('relationship')}
                />
              )}
            </FormField>
            <div className="sm:col-span-3">
              <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
                {ar ? 'إضافة' : 'Add'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ar ? 'جهات الاتصال' : 'Contacts'}</CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.isPending ? (
            <div className="flex items-center justify-center py-6" role="status">
              <Spinner />
            </div>
          ) : !contacts.data || contacts.data.length === 0 ? (
            <EmptyState
              icon={<Phone className="h-6 w-6" aria-hidden="true" />}
              title={ar ? 'مفيش جهات اتصال' : 'No contacts yet'}
              description={ar ? 'ضيف رقم من فوق' : 'Add one above'}
            />
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {contacts.data.map((c) => (
                <li key={c._id} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="text-xs text-[var(--color-fg-muted)]">
                      {formatEgPhoneDisplay(c.phone)} · {c.relationship}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={ar ? 'حذف' : 'Delete'}
                    onClick={() => removeContact(c._id)}
                    className="rounded-md p-2 text-[var(--color-danger-500)] hover:bg-[var(--color-danger-500)]/10"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
