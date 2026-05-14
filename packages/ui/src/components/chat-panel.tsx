'use client';

import * as React from 'react';
import { Send } from 'lucide-react';
import { cn } from '../lib/cn';

export interface ChatPanelMessage {
  id: string;
  from: 'self' | 'other' | 'system';
  text: string;
  /** Timestamp shown beneath the bubble. */
  at?: Date | string;
}

export interface ChatPanelProps {
  messages: ChatPanelMessage[];
  onSend: (text: string) => void;
  /** Disable input while the socket is reconnecting. */
  disabled?: boolean;
  placeholder?: string;
  sendLabel: string;
  emptyHint?: string;
  className?: string;
  /** Locale governs the time format only. */
  locale?: 'ar-EG' | 'en-EG';
}

/**
 * Simple bubble-chat list + input. Self messages right-aligned in RTL
 * (auto-flipped), other left-aligned. Auto-scrolls to bottom on new
 * message. Enter sends; Shift+Enter inserts newline.
 */
export function ChatPanel({
  messages,
  onSend,
  disabled,
  placeholder,
  sendLabel,
  emptyHint,
  className,
  locale = 'ar-EG',
}: ChatPanelProps): React.ReactElement {
  const [draft, setDraft] = React.useState('');
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const timeFmt = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: 'numeric' }),
    [locale],
  );

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        className="flex-1 overflow-y-auto p-3 space-y-2"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-[var(--color-fg-muted)]">{emptyHint}</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'flex flex-col max-w-[80%]',
                m.from === 'self' ? 'self-end items-end' : 'items-start',
              )}
            >
              <div
                className={cn(
                  'rounded-2xl px-3 py-1.5 text-sm',
                  m.from === 'self'
                    ? 'bg-[var(--color-brand-600)] text-white'
                    : m.from === 'system'
                      ? 'bg-[var(--color-bg-muted)] italic text-[var(--color-fg-muted)]'
                      : 'bg-[var(--color-bg-muted)] text-[var(--color-fg)]',
                )}
              >
                {m.text}
              </div>
              {m.at ? (
                <span className="mt-0.5 text-[10px] text-[var(--color-fg-muted)]">
                  {timeFmt.format(new Date(m.at))}
                </span>
              ) : null}
            </div>
          ))
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex gap-2 border-t border-[var(--color-border)] p-2"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={placeholder ?? 'Message'}
          className="min-h-[2.5rem] max-h-32 flex-1 resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !draft.trim()}
          aria-label={sendLabel}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
