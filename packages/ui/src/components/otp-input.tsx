'use client';

import * as React from 'react';
import { cn } from '../lib/cn';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  /** Auto-submit when fully populated. */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  'aria-label'?: string;
}

/**
 * Six-digit OTP input. Renders one box per digit, supports paste, arrow-key
 * navigation, and backspace-to-previous. Numeric input mode triggers the
 * numeric keyboard on mobile.
 */
export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  invalid = false,
  autoFocus = false,
  'aria-label': ariaLabel = 'OTP',
}: OtpInputProps): React.ReactElement {
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = React.useMemo(() => {
    const arr = value.split('').slice(0, length);
    while (arr.length < length) arr.push('');
    return arr;
  }, [value, length]);

  React.useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus();
  }, [autoFocus]);

  const update = (next: string) => {
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    if (!digit) return;
    const next = digits.slice();
    next[index] = digit;
    update(next.join('').slice(0, length));
    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = digits.slice();
        next[index] = '';
        update(next.join(''));
      } else if (index > 0) {
        const next = digits.slice();
        next[index - 1] = '';
        update(next.join(''));
        inputsRef.current[index - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    update(pasted);
    inputsRef.current[Math.min(pasted.length, length - 1)]?.focus();
    e.preventDefault();
  };

  return (
    <div role="group" aria-label={ariaLabel} className="flex justify-center gap-2 [direction:ltr]">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={d}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-label={`${ariaLabel} digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className={cn(
            'h-12 w-12 rounded-md border bg-[var(--color-bg)] text-center text-xl font-semibold text-[var(--color-fg)]',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            invalid ? 'border-[var(--color-danger-500)]' : 'border-[var(--color-border)]',
          )}
        />
      ))}
    </div>
  );
}
