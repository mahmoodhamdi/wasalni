import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * Button — shadcn-style primitive on top of native <button>. RTL-safe
 * (uses logical props), focus-visible ring, disabled state, busy state.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-[var(--color-bg)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-700)] active:bg-[var(--color-brand-800)] shadow-sm',
        secondary:
          'bg-[var(--color-bg-muted)] text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)] border border-[var(--color-border)]',
        outline:
          'border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-bg-subtle)] text-[var(--color-fg)]',
        ghost: 'bg-transparent hover:bg-[var(--color-bg-subtle)] text-[var(--color-fg)]',
        link: 'bg-transparent text-[var(--color-brand-600)] underline-offset-4 hover:underline',
        danger:
          'bg-[var(--color-danger-500)] text-white hover:opacity-90 active:opacity-80 shadow-sm',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-5 text-base',
        icon: 'h-10 w-10',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** When true, renders a spinner and disables the button. */
  isLoading?: boolean;
  /** Optional label for the spinner state (screen-reader announcement). */
  loadingLabel?: string;
}

const Spinner = ({ label }: { label?: string }) => (
  <svg aria-hidden="true" className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    {label ? <title>{label}</title> : null}
  </svg>
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading = false,
      loadingLabel,
      disabled,
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...rest}
      >
        {isLoading ? <Spinner label={loadingLabel} /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
