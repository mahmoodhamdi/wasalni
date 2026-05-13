'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../lib/cn';

export interface RatingStarsProps {
  value: number;
  onChange?: (next: number) => void;
  max?: number;
  /** Larger touch targets for mobile. */
  size?: 'sm' | 'md' | 'lg';
  /** Read-only display (no input semantics). */
  readOnly?: boolean;
  /** Accessible label for the radiogroup. */
  'aria-label'?: string;
  className?: string;
}

const SIZE_MAP: Record<NonNullable<RatingStarsProps['size']>, string> = {
  sm: 'h-5 w-5',
  md: 'h-7 w-7',
  lg: 'h-9 w-9',
};

/**
 * 5-star rating input. Behaves like a radiogroup when interactive,
 * `img` when read-only. Stars are pure SVG (no external icon font).
 */
export function RatingStars({
  value,
  onChange,
  max = 5,
  size = 'md',
  readOnly = false,
  'aria-label': ariaLabel = 'Rating',
  className,
}: RatingStarsProps): React.ReactElement {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  const cls = SIZE_MAP[size];

  if (readOnly) {
    return (
      <span
        role="img"
        aria-label={`${value} ${ariaLabel}`}
        className={cn('inline-flex gap-1', className)}
      >
        {stars.map((s) => (
          <Star
            key={s}
            className={cn(
              cls,
              s <= value
                ? 'fill-current text-[var(--color-warning-500)]'
                : 'text-[var(--color-fg-muted)]',
            )}
            aria-hidden="true"
          />
        ))}
      </span>
    );
  }

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn('inline-flex gap-1', className)}>
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          aria-label={`${s}`}
          onClick={() => onChange?.(s)}
          className="rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2"
        >
          <Star
            className={cn(
              cls,
              'transition-colors',
              s <= value
                ? 'fill-current text-[var(--color-warning-500)]'
                : 'text-[var(--color-fg-muted)]',
            )}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}
