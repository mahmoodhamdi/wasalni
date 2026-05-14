'use client';

import * as React from 'react';

/**
 * Returns `value` only after `delayMs` has elapsed without change.
 * Used by the place autocomplete to avoid querying the backend on every
 * keystroke.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState<T>(value);
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
