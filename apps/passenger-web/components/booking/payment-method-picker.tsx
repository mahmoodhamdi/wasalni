'use client';

import * as React from 'react';
import { Banknote, CreditCard, Wallet } from 'lucide-react';
import type { PaymentMethod } from '@wasalni/schemas';
import type { Locale } from '@wasalni/i18n';

interface Props {
  value: PaymentMethod;
  onChange: (v: PaymentMethod) => void;
  locale: Locale;
}

const OPTIONS: Array<{
  key: PaymentMethod;
  icon: React.ElementType;
  label: { ar: string; en: string };
}> = [
  { key: 'cash', icon: Banknote, label: { ar: 'كاش', en: 'Cash' } },
  { key: 'wallet', icon: Wallet, label: { ar: 'محفظة', en: 'Wallet' } },
  { key: 'card', icon: CreditCard, label: { ar: 'بطاقة', en: 'Card' } },
];

export function PaymentMethodPicker({ value, onChange, locale }: Props): React.ReactElement {
  return (
    <div
      className="mt-3 flex gap-2"
      role="radiogroup"
      aria-label={locale === 'ar' ? 'طريقة الدفع' : 'Payment method'}
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const checked = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(opt.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2 ${
              checked
                ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-brand-800)]'
                : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="font-medium">{opt.label[locale]}</span>
          </button>
        );
      })}
    </div>
  );
}
