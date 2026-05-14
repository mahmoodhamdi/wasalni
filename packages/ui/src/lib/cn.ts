import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind-aware class merger. Folds clsx (handles conditionals + arrays)
 * into tailwind-merge (resolves conflicting utility classes correctly,
 * with the last one winning).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
