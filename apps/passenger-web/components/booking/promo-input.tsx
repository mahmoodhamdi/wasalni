'use client';

import * as React from 'react';
import { Ticket, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input, Button } from '@wasalni/ui';
import { useAuth } from '@wasalni/auth/react';
import type { Locale } from '@wasalni/i18n';

interface Props {
  value: string;
  onChange: (next: string) => void;
  onApplied: (info: AppliedPromo | null) => void;
  locale: Locale;
}

export interface AppliedPromo {
  code: string;
  discountPercent?: number;
  discountFixed?: number;
  description?: string;
}

export function PromoInput({ value, onChange, onApplied, locale }: Props): React.ReactElement {
  const { fetcher } = useAuth();
  const [checking, setChecking] = React.useState(false);
  const [applied, setApplied] = React.useState<AppliedPromo | null>(null);
  const ar = locale === 'ar';

  const apply = async () => {
    const code = value.trim();
    if (!code || checking) return;
    setChecking(true);
    try {
      const res = await fetcher(`/api/promos/validate?code=${encodeURIComponent(code)}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        toast.error(ar ? 'الكود غير صحيح' : 'Invalid promo code');
        return;
      }
      const body = (await res.json()) as {
        data: {
          valid: boolean;
          code: string;
          discountPercent?: number;
          discountFixed?: number;
          description?: string;
        };
      };
      if (!body.data.valid) {
        toast.error(ar ? 'الكود غير صحيح أو منتهي' : 'Invalid or expired code');
        return;
      }
      const promo: AppliedPromo = {
        code: body.data.code,
        discountPercent: body.data.discountPercent,
        discountFixed: body.data.discountFixed,
        description: body.data.description,
      };
      setApplied(promo);
      onApplied(promo);
      toast.success(ar ? 'تم تطبيق الكود' : 'Code applied');
    } catch {
      toast.error(ar ? 'مشكلة في الشبكة' : 'Network error');
    } finally {
      setChecking(false);
    }
  };

  const remove = () => {
    setApplied(null);
    onApplied(null);
    onChange('');
  };

  if (applied) {
    return (
      <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--color-success-500)]/30 bg-[var(--color-success-500)]/10 px-3 py-2">
        <span className="flex items-center gap-2 text-sm font-medium text-[var(--color-success-500)]">
          <Check className="h-4 w-4" aria-hidden="true" />
          {applied.code}
          {applied.description ? (
            <span className="text-[var(--color-fg-muted)] font-normal">
              · {applied.description}
            </span>
          ) : null}
        </span>
        <button
          type="button"
          onClick={remove}
          aria-label={ar ? 'إزالة' : 'Remove'}
          className="text-[var(--color-fg-muted)] hover:text-[var(--color-danger-500)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <div className="relative flex-1">
        <Ticket
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-[var(--color-fg-muted)]"
          aria-hidden="true"
        />
        <Input
          type="text"
          dir="ltr"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder={ar ? 'كود الخصم' : 'Promo code'}
          className="ps-10"
          aria-label={ar ? 'كود الخصم' : 'Promo code'}
        />
      </div>
      <Button type="button" size="sm" variant="outline" isLoading={checking} onClick={apply}>
        {ar ? 'تطبيق' : 'Apply'}
      </Button>
    </div>
  );
}
