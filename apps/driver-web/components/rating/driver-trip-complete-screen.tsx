'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { CheckCircle2, Home } from 'lucide-react';
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
import type { ITrip, IPassenger } from '@wasalni/shared-types';

interface Props {
  tripId: string;
  locale: Locale;
}

export function DriverTripCompleteScreen({ tripId, locale }: Props): React.ReactElement {
  const { fetcher } = useAuth();
  const router = useRouter();
  const [score, setScore] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const { data: trip } = useQuery<ITrip>({
    queryKey: ['driver-trip', tripId],
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
        body: JSON.stringify({ score }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(b?.error ?? (ar ? 'تعذّر إرسال التقييم' : 'Could not submit rating'));
        return;
      }
      setSubmitted(true);
      toast.success(ar ? 'تم إرسال التقييم' : 'Rating submitted');
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

  const passenger = typeof trip.passenger === 'object' ? (trip.passenger as IPassenger) : null;

  return (
    <div className="mx-auto max-w-md space-y-4 py-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-[var(--color-success-500)]" aria-hidden="true" />
            <div>
              <CardTitle>{ar ? 'الرحلة اكتملت' : 'Trip complete'}</CardTitle>
              <CardDescription>
                {ar ? 'دخلت أرباحك للمحفظة' : 'Your earnings are in the wallet'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-[var(--color-success-500)]/10 p-3 text-center">
            <p className="text-xs text-[var(--color-fg-muted)]">{ar ? 'كسبت' : 'You earned'}</p>
            <p className="mt-1 text-3xl font-bold text-[var(--color-success-500)]">
              {formatMoney(trip.fare.driverEarnings)}
            </p>
          </div>
        </CardContent>
      </Card>

      {passenger ? (
        <Card>
          <CardHeader>
            <CardTitle>{ar ? `قيّم ${passenger.name}` : `Rate ${passenger.name}`}</CardTitle>
            <CardDescription>
              {ar ? 'تقييمك يساعدنا نطمئن باقي السواقين' : 'Helps us keep the platform safe'}
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
              <Button
                type="button"
                size="lg"
                fullWidth
                isLoading={submitting}
                disabled={score === 0 || submitted}
                onClick={submit}
              >
                {submitted ? (ar ? 'تم الإرسال' : 'Submitted') : ar ? 'إرسال' : 'Submit'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="lg"
        fullWidth
        onClick={() => router.replace(`/${locale}/home`)}
      >
        <Home className="h-5 w-5" aria-hidden="true" />
        {ar ? 'الرجوع للرئيسية' : 'Back to home'}
      </Button>
    </div>
  );
}
