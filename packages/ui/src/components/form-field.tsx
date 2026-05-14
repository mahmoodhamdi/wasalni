'use client';

import * as React from 'react';
import { cn } from '../lib/cn';

/**
 * Accessible field wrapper that ties a label, optional description, the
 * actual input slot, and an error message together with the right ARIA
 * relationships. Use for any form field, custom or native.
 */
export interface FormFieldProps {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: (slotProps: {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
  }) => React.ReactNode;
}

export function FormField({
  id,
  label,
  description,
  error,
  required,
  className,
  children,
}: FormFieldProps): React.ReactElement {
  const descId = description ? `${id}-desc` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [descId, errId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col', className)}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
        {label}
        {required ? (
          <span aria-hidden="true" className="ms-1 text-[var(--color-danger-500)]">
            *
          </span>
        ) : null}
      </label>
      {description ? (
        <p id={descId} className="mb-2 text-xs text-[var(--color-fg-muted)]">
          {description}
        </p>
      ) : null}
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {error ? (
        <p id={errId} role="alert" className="mt-1.5 text-xs text-[var(--color-danger-500)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
