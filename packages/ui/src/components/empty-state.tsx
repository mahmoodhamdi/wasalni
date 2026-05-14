import * as React from 'react';
import { cn } from '../lib/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-8 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-fg-muted)]">
          {icon}
        </div>
      ) : null}
      <p className="text-base font-medium text-[var(--color-fg)]">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-[var(--color-fg-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
