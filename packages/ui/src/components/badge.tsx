import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:ring-offset-2',
  {
    variants: {
      variant: {
        neutral: 'bg-[var(--color-bg-muted)] text-[var(--color-fg)]',
        brand: 'bg-[var(--color-brand-100)] text-[var(--color-brand-800)]',
        success: 'bg-[var(--color-success-500)]/15 text-[var(--color-success-500)]',
        warning: 'bg-[var(--color-warning-500)]/15 text-[var(--color-warning-500)]',
        danger: 'bg-[var(--color-danger-500)]/15 text-[var(--color-danger-500)]',
        info: 'bg-[var(--color-info-500)]/15 text-[var(--color-info-500)]',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps): React.ReactElement {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
