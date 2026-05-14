'use client';

import * as React from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { useDebounce } from '../hooks/use-debounce';

export interface PlaceResult {
  id: string;
  name: string;
  /** Optional address details (city, district). */
  description?: string;
  longitude: number;
  latitude: number;
}

export interface PlaceAutocompleteProps {
  /** The current value (controlled). */
  value: string;
  /** Field id (for label association). */
  id: string;
  /** Placeholder text. */
  placeholder?: string;
  /** Called when the user picks a suggestion. */
  onSelect: (place: PlaceResult) => void;
  /** Called on every keystroke. The parent owns the input value. */
  onChange: (next: string) => void;
  /** Optional near-by coordinates to bias results (passenger's location). */
  near?: { latitude: number; longitude: number };
  /** URL of the search endpoint. Default `/api/places/search`. */
  searchUrl?: string;
  /** Render variant. */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state. */
  disabled?: boolean;
  /** Optional aria-label when no visible label. */
  'aria-label'?: string;
  /** Locale ('ar' default) — used for the loading / empty messages. */
  locale?: 'ar' | 'en';
  /** Override the fetch implementation (for tests). */
  fetcher?: typeof fetch;
}

interface SearchResponse {
  success: boolean;
  data?: PlaceResult[];
}

const STRINGS = {
  ar: { loading: 'جاري البحث…', empty: 'لا توجد نتائج', clear: 'مسح' },
  en: { loading: 'Searching…', empty: 'No results', clear: 'Clear' },
} as const;

/**
 * Headless+styled place autocomplete. Debounces the query, calls the
 * backend search endpoint, renders the results in a popover, supports
 * keyboard navigation, and reports the chosen place back to the parent.
 *
 * The fetch is delegated to the parent's fetcher (so the consumer can
 * inject auth/CSRF headers via `@wasalni/auth`).
 */
export function PlaceAutocomplete({
  value,
  id,
  placeholder,
  onSelect,
  onChange,
  near,
  searchUrl = '/api/places/search',
  size = 'md',
  disabled,
  'aria-label': ariaLabel,
  locale = 'ar',
  fetcher = typeof fetch !== 'undefined' ? fetch : undefined,
}: PlaceAutocompleteProps): React.ReactElement {
  const t = STRINGS[locale];
  const [open, setOpen] = React.useState(false);
  const [results, setResults] = React.useState<PlaceResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const debouncedValue = useDebounce(value, 250);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const listRef = React.useRef<HTMLUListElement | null>(null);

  React.useEffect(() => {
    if (!debouncedValue || debouncedValue.trim().length < 2 || !fetcher) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const url = new URL(
      searchUrl,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
    );
    url.searchParams.set('q', debouncedValue);
    if (near) {
      url.searchParams.set('lat', String(near.latitude));
      url.searchParams.set('lng', String(near.longitude));
    }
    fetcher(url.toString(), { signal: controller.signal, credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: SearchResponse | null) => {
        if (body?.success && Array.isArray(body.data)) {
          setResults(body.data);
        } else {
          setResults([]);
        }
      })
      .catch(() => {
        // ignored — likely aborted on next keystroke
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [debouncedValue, near?.latitude, near?.longitude, searchUrl, fetcher, near]);

  const sizeClasses: Record<typeof size, string> = {
    sm: 'h-9 text-sm',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base',
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      const active = results[activeIndex];
      if (active) {
        e.preventDefault();
        onSelect(active);
        setOpen(false);
        setActiveIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-[var(--color-fg-muted)]"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined}
          aria-label={ariaLabel}
          autoComplete="off"
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          className={`flex w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] ps-10 pe-9 text-[var(--color-fg)] placeholder:text-[var(--color-fg-muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses[size]}`}
        />
        {value && !loading ? (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setResults([]);
              inputRef.current?.focus();
            }}
            aria-label={t.clear}
            className="absolute top-1/2 -translate-y-1/2 end-2 rounded-md p-1 text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-muted)]"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        {loading ? (
          <Loader2
            className="absolute top-1/2 -translate-y-1/2 end-3 h-4 w-4 animate-spin text-[var(--color-brand-600)]"
            aria-hidden="true"
          />
        ) : null}
      </div>
      {open &&
      (results.length > 0 ||
        (loading && value.length >= 2) ||
        (!loading && value.length >= 2 && results.length === 0)) ? (
        <ul
          ref={listRef}
          id={`${id}-listbox`}
          role="listbox"
          className="absolute top-full z-30 mt-1.5 max-h-72 w-full overflow-y-auto rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-elevated)]"
        >
          {loading && results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[var(--color-fg-muted)]">{t.loading}</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[var(--color-fg-muted)]">{t.empty}</li>
          ) : (
            results.map((place, i) => (
              <li
                key={place.id}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={activeIndex === i}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault(); // keep input focused so blur doesn't fire first
                  onSelect(place);
                  setOpen(false);
                }}
                className={`flex cursor-pointer items-start gap-2 px-3 py-2 text-sm ${
                  activeIndex === i ? 'bg-[var(--color-bg-muted)]' : ''
                }`}
              >
                <MapPin
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-fg-muted)]"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[var(--color-fg)]">{place.name}</p>
                  {place.description ? (
                    <p className="truncate text-xs text-[var(--color-fg-muted)]">
                      {place.description}
                    </p>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
