'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { CheckCircle2 } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  RatingStars,
  Spinner,
} from '@wasalni/ui';
import { useAuth } from '@wasalni/auth/react';
import { formatMoney } from '@wasalni/utils/currency';
import type { Locale } from '@wasalni/i18n';
import type { ITrip, IDriver } from '@wasalni/shared-types';

interface Props {
  tripId: string;
  locale: Locale;
}

export function TripCompleteScreen({ tripId, locale }: Props): React.ReactElement {
  const { fetcher } = useAuth();
  const router = useRouter();
  const [score, setScore] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const { data: trip } = useQuery<ITrip>({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const res = await fetcher(`/api/trips/${tripId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('trip-not-found');
      const body = (await res.json()) as { data: ITrip };
      return body.data;
    },
  });

  const ar = locale === 'ar';

  const submit = async () => {
    if (score === 0 || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetcher(`/api/trips/${tripId}/rate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ score, comment: comment || undefined }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(b?.error ?? (ar ? 'تعذّر إرسال التقييم' : 'Could not submit rating'));
        return;
      }
      setSubmitted(true);
      toast.success(ar ? 'تم إرسال تقييمك. شكراً!' : 'Thanks for rating!');
      window.setTimeout(() => router.replace(`/${locale}`), 1200);
    } finally {
      setSubmitting(false);
    }
  };

  if (!trip) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <Spinner size="lg" />
      </div>
    );
  }

  const driver = typeof trip.driver === 'object' ? (trip.driver as IDriver) : null;
  const fare = trip.fare;

  return (
    <div className="mx-auto max-w-md space-y-4 py-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2
              className="h-6 w-6 flex-shrink-0 text-[var(--color-success-500)]"
              aria-hidden="true"
            />
            <div>
              <CardTitle>{ar ? 'وصلت بأمان!' : "You've arrived"}</CardTitle>
              <CardDescription>
                {ar
                  ? 'تقدر تشوف تفاصيل الرحلة وتقيم السائق'
                  : 'See your trip details and rate the driver'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <FareRow
            label={ar ? 'تمن الرحلة' : 'Base fare'}
            value={fare.baseFare + fare.distanceFare + fare.timeFare}
          />
          {fare.surgeFare > 0 ? (
            <FareRow label={ar ? 'زيادة الذروة' : 'Surge'} value={fare.surgeFare} />
          ) : null}
          {fare.discount + fare.promoDiscount > 0 ? (
            <FareRow
              label={ar ? 'الخصم' : 'Discount'}
              value={-(fare.discount + fare.promoDiscount)}
            />
          ) : null}
          <div className="my-2 border-t border-[var(--color-border)]" />
          <div className="flex items-center justify-between text-base font-bold">
            <span>{ar ? 'الإجمالي' : 'Total'}</span>
            <span>{formatMoney(fare.total)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {driver
              ? ar
                ? `قيّم ${driver.name}`
                : `Rate ${driver.name}`
              : ar
                ? 'قيّم رحلتك'
                : 'Rate your trip'}
          </CardTitle>
          <CardDescription>
            {ar ? 'تقييمك يساعدنا نحسّن الخدمة' : 'Your rating helps us improve'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3">
            <RatingStars
              value={score}
              onChange={setScore}
              size="lg"
              aria-label={ar ? 'تقييم' : 'Rating'}
            />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 280))}
              placeholder={ar ? 'تعليق اختياري' : 'Optional comment'}
              rows={3}
              maxLength={280}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2"
            />
            <Button
              type="button"
              size="lg"
              fullWidth
              isLoading={submitting}
              disabled={score === 0 || submitted}
              onClick={submit}
            >
              {submitted
                ? ar
                  ? 'تم الإرسال'
                  : 'Submitted'
                : ar
                  ? 'إرسال التقييم'
                  : 'Submit rating'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FareRow({ label, value }: { label: string; value: number }): React.ReactElement {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--color-fg-muted)]">{label}</span>
      <span className="text-[var(--color-fg)]">{formatMoney(value)}</span>
    </div>
  );
}
