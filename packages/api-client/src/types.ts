/**
 * The Wasalni backend wraps every successful JSON response in:
 *   { success: true, data: T, message?: string }
 * and every failure in:
 *   { success: false, error: string, code?: string, details?: unknown }
 */

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiFailure {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

/**
 * Pagination envelope used by list endpoints.
 */
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

export interface RequestOptions {
  /** AbortSignal forwarded to fetch */
  signal?: AbortSignal;
  /** Per-request override; defaults to the client's. */
  baseUrl?: string;
  /** Per-request extra headers */
  headers?: Record<string, string>;
  /** Skip credentials for this call (rare; default includes credentials). */
  skipCredentials?: boolean;
}
