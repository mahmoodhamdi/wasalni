'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, ArrowUpRight, Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Spinner,
} from '@wasalni/ui';
import { useAuth } from '@wasalni/auth/react';
import { formatMoney } from '@wasalni/utils/currency';
import { formatRelative } from '@wasalni/utils/date';
import type { Locale } from '@wasalni/i18n';

interface Props {
  locale: Locale;
}

interface Summary {
  today: number;
  week: number;
  month: number;
  pendingPayout: number;
  totalTrips: number;
}

interface WalletSummary {
  balance: number;
  pendingPayout: number;
  recentTransactions: Array<{
    _id: string;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
  }>;
}

export function EarningsScreen({ locale }: Props): React.ReactElement {
  const { fetcher } = useAuth();
  const queryClient = useQueryClient();
  const ar = locale === 'ar';

  const summary = useQuery<Summary>({
    queryKey: ['driver-earnings-summary'],
    queryFn: async () => {
      const res = await fetcher('/api/driver/earnings/summary', { credentials: 'include' });
      if (!res.ok) throw new Error('failed');
      const body = (await res.json()) as { data: Summary };
      return body.data;
    },
  });

  const wallet = useQuery<WalletSummary>({
    queryKey: ['driver-wallet'],
    queryFn: async () => {
      const res = await fetcher('/api/wallet', { credentials: 'include' });
      if (!res.ok) throw new Error('failed');
      const body = (await res.json()) as { data: WalletSummary };
      return body.data;
    },
  });

  const [withdrawAmount, setWithdrawAmount] = React.useState('');
  const [withdrawing, setWithdrawing] = React.useState(false);

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount, 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(ar ? 'ادخل مبلغ صحيح' : 'Enter a valid amount');
      return;
    }
    setWithdrawing(true);
    try {
      const res = await fetcher('/api/driver/earnings/withdraw', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(b?.error ?? (ar ? 'تعذّر طلب السحب' : 'Could not request withdrawal'));
        return;
      }
      toast.success(ar ? 'تم طلب السحب' : 'Withdrawal requested');
      setWithdrawAmount('');
      queryClient.invalidateQueries({ queryKey: ['driver-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['driver-earnings-summary'] });
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 py-4">
      <header>
        <h1 className="text-2xl font-bold">{ar ? 'أرباحي' : 'Earnings'}</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label={ar ? 'النهاردة' : 'Today'}
          value={summary.data?.today ?? 0}
          loading={summary.isPending}
        />
        <StatCard
          label={ar ? 'الأسبوع' : 'Week'}
          value={summary.data?.week ?? 0}
          loading={summary.isPending}
        />
        <StatCard
          label={ar ? 'الشهر' : 'Month'}
          value={summary.data?.month ?? 0}
          loading={summary.isPending}
        />
        <StatCard
          label={ar ? 'الرحلات' : 'Trips'}
          value={summary.data?.totalTrips ?? 0}
          loading={summary.isPending}
          isCurrency={false}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Banknote className="h-5 w-5" aria-hidden="true" />
              {ar ? 'السحب' : 'Withdraw'}
            </span>
          </CardTitle>
          <CardDescription>
            {ar
              ? 'سحب الأرباح للحساب البنكي أو محفظتك الإلكترونية'
              : 'Move your earnings to your bank or wallet'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-[var(--color-success-500)]/10 p-3 text-center">
            <p className="text-xs text-[var(--color-fg-muted)]">
              {ar ? 'المتاح للسحب' : 'Available'}
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-success-500)]">
              {formatMoney(wallet.data?.balance ?? 0)}
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              max={wallet.data?.balance ?? undefined}
              placeholder={ar ? 'المبلغ' : 'Amount'}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              disabled={withdrawing}
            />
            <Button
              type="button"
              isLoading={withdrawing}
              disabled={!withdrawAmount}
              onClick={handleWithdraw}
            >
              {ar ? 'اسحب' : 'Withdraw'}
              <ArrowUpRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ar ? 'آخر المعاملات' : 'Recent transactions'}</CardTitle>
        </CardHeader>
        <CardContent>
          {wallet.isPending ? (
            <div className="flex items-center justify-center py-6" role="status">
              <Spinner />
            </div>
          ) : !wallet.data || wallet.data.recentTransactions.length === 0 ? (
            <EmptyState
              icon={<Coins className="h-6 w-6" aria-hidden="true" />}
              title={ar ? 'لسه مفيش معاملات' : 'No transactions yet'}
            />
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {wallet.data.recentTransactions.map((tx) => (
                <li key={tx._id} className="flex items-center gap-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-[var(--color-fg-muted)]">
                      {formatRelative(tx.createdAt, ar ? 'ar-EG' : 'en-EG')}
                    </p>
                  </div>
                  <Badge variant={tx.amount > 0 ? 'success' : 'danger'}>
                    {tx.amount > 0 ? '+' : ''}
                    {formatMoney(tx.amount)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
  isCurrency = true,
}: {
  label: string;
  value: number;
  loading?: boolean;
  isCurrency?: boolean;
}): React.ReactElement {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-[var(--color-fg-muted)]">{label}</p>
        {loading ? (
          <div className="mt-1 h-6 w-20 animate-pulse rounded bg-[var(--color-bg-muted)]" />
        ) : (
          <p className="mt-1 text-xl font-bold">{isCurrency ? formatMoney(value) : value}</p>
        )}
      </CardContent>
    </Card>
  );
}
