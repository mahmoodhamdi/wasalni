'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Gift } from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, Spinner } from '@wasalni/ui';
import { useAuth } from '@wasalni/auth/react';
import { formatMoney } from '@wasalni/utils/currency';
import { formatRelative } from '@wasalni/utils/date';
import type { Locale } from '@wasalni/i18n';
import type { ITransaction, TransactionType } from '@wasalni/shared-types';

interface Props {
  locale: Locale;
}

interface Summary {
  balance: number;
  pendingPayout: number;
  recentTransactions: ITransaction[];
}

const TX_LABELS: Record<TransactionType, { ar: string; en: string }> = {
  trip_earning: { ar: 'كسب رحلة', en: 'Trip earnings' },
  trip_payment: { ar: 'دفع رحلة', en: 'Trip payment' },
  wallet_topup: { ar: 'شحن', en: 'Top-up' },
  wallet_withdrawal: { ar: 'سحب', en: 'Withdrawal' },
  bonus: { ar: 'مكافأة', en: 'Bonus' },
  penalty: { ar: 'خصم', en: 'Penalty' },
  refund: { ar: 'استرداد', en: 'Refund' },
};

export function WalletScreen({ locale }: Props): React.ReactElement {
  const { fetcher } = useAuth();
  const ar = locale === 'ar';

  const { data, isPending } = useQuery<Summary>({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await fetcher('/api/wallet', { credentials: 'include' });
      if (!res.ok) throw new Error('failed');
      const body = (await res.json()) as { data: Summary };
      return body.data;
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4 py-4">
      <header>
        <h1 className="text-2xl font-bold">{ar ? 'محفظتي' : 'My wallet'}</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          {ar ? 'رصيدك ومعاملاتك الأخيرة' : 'Your balance and recent activity'}
        </p>
      </header>

      <Card>
        <CardContent className="flex items-center gap-4 py-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
            <Wallet className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-[var(--color-fg-muted)]">{ar ? 'الرصيد' : 'Balance'}</p>
            {isPending ? (
              <div className="mt-1 h-8 w-32 animate-pulse rounded bg-[var(--color-bg-muted)]" />
            ) : (
              <p className="mt-1 text-3xl font-bold">{formatMoney(data?.balance ?? 0)}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ar ? 'آخر المعاملات' : 'Recent transactions'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="flex items-center justify-center py-8" role="status">
              <Spinner />
            </div>
          ) : !data || data.recentTransactions.length === 0 ? (
            <EmptyState
              icon={<Gift className="h-6 w-6" aria-hidden="true" />}
              title={ar ? 'لسه مفيش معاملات' : 'No transactions yet'}
              description={
                ar ? 'كل عملية دفع أو سحب هتلاقيها هنا' : 'Payments and top-ups will appear here'
              }
            />
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {data.recentTransactions.map((tx) => {
                const credit = tx.amount > 0;
                return (
                  <li key={tx._id} className="flex items-center gap-3 py-2">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        credit
                          ? 'bg-[var(--color-success-500)]/15 text-[var(--color-success-500)]'
                          : 'bg-[var(--color-danger-500)]/15 text-[var(--color-danger-500)]'
                      }`}
                    >
                      {credit ? (
                        <ArrowDownCircle className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ArrowUpCircle className="h-4 w-4" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{TX_LABELS[tx.type][locale]}</p>
                      <p className="text-xs text-[var(--color-fg-muted)]">
                        {formatRelative(tx.createdAt, ar ? 'ar-EG' : 'en-EG')}
                      </p>
                    </div>
                    <Badge variant={credit ? 'success' : 'danger'}>
                      {credit ? '+' : ''}
                      {formatMoney(tx.amount)}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
