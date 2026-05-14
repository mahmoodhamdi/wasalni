import * as React from 'react';
import { cn } from '../lib/cn';

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  /** Screen-reader label. Default: an empty title (decorative). */
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Spinner({
  label,
  size = 'md',
  className,
  ...props
}: SpinnerProps): React.ReactElement {
  return (
    <svg
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      className={cn('animate-spin text-[var(--color-brand-600)]', sizeMap[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
