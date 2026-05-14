import * as React from 'react';
import { cn } from '../lib/cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Pair with form fields via `htmlFor`. Visually indicates required state. */
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'block text-sm font-medium text-[var(--color-fg)] mb-1.5',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className,
        )}
        {...props}
      >
        {children}
        {required ? (
          <span aria-hidden="true" className="text-[var(--color-danger-500)] ms-1">
            *
          </span>
        ) : null}
      </label>
    );
  },
);
Label.displayName = 'Label';
