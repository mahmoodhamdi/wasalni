'use client';

import * as React from 'react';
import { ShieldAlert } from 'lucide-react';
import { cn } from '../lib/cn';

export interface SosButtonProps {
  /**
   * Long-press duration in ms before the SOS fires. Defaults to 2000.
   * Tapping briefly does nothing — prevents accidental triggers.
   */
  holdMs?: number;
  onTrigger: () => void;
  label: string;
  hint: string;
  className?: string;
}

/**
 * Long-press SOS button. Shows a progress ring as the user holds. Releases
 * before completion cancel the trigger.
 */
export function SosButton({
  holdMs = 2000,
  onTrigger,
  label,
  hint,
  className,
}: SosButtonProps): React.ReactElement {
  const [progress, setProgress] = React.useState(0);
  const startedAtRef = React.useRef<number | null>(null);
  const rafRef = React.useRef<number | null>(null);

  const stop = React.useCallback(() => {
    startedAtRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setProgress(0);
  }, []);

  const start = React.useCallback(() => {
    if (startedAtRef.current !== null) return;
    startedAtRef.current = performance.now();
    const tick = () => {
      const startedAt = startedAtRef.current;
      if (startedAt === null) return;
      const elapsed = performance.now() - startedAt;
      const ratio = Math.min(1, elapsed / holdMs);
      setProgress(ratio);
      if (ratio >= 1) {
        stop();
        onTrigger();
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [holdMs, onTrigger, stop]);

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <button
        type="button"
        aria-label={label}
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-danger-500)] text-white shadow-[var(--shadow-overlay)] hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-danger-500)]/40"
      >
        <ShieldAlert className="h-8 w-8" aria-hidden="true" />
        {progress > 0 ? (
          <svg
            aria-hidden="true"
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 64 64"
          >
            <circle
              cx="32"
              cy="32"
              r="30"
              fill="none"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="3"
              strokeDasharray={`${progress * 188.5} 188.5`}
              strokeLinecap="round"
            />
          </svg>
        ) : null}
      </button>
      <span className="text-center text-xs text-[var(--color-fg-muted)]">{hint}</span>
    </div>
  );
}
