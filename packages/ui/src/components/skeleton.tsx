import * as React from 'react';
import { cn } from '../lib/cn';

/**
 * Loading placeholder. Honours `prefers-reduced-motion` via the global rule
 * in @wasalni/config-tailwind/tokens.css.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-[var(--color-bg-muted)]', className)}
      {...props}
    />
  );
}
