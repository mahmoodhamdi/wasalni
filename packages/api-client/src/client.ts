import {
  ApiError,
  NetworkError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
  type ApiErrorPayload,
} from './errors.js';
import type { ApiEnvelope, RequestOptions } from './types.js';

export interface ApiClientOptions {
  /** Backend base URL, e.g. https://api.wasalni.com/api/v1 */
  baseUrl: string;
  /**
   * Optional auth-token getter. Returns the bearer token to send on every
   * request, or null/undefined to skip the `Authorization` header.
   *
   * In browser code this stays null — we use httpOnly cookies via the
   * Next.js Route Handler proxy. In server code (Route Handlers calling
   * the backend) the proxy reads the cookie and sets the bearer.
   */
  getAuthToken?: () => string | null | undefined | Promise<string | null | undefined>;
  /** Default fetch implementation. Override for tests. */
  fetch?: typeof globalThis.fetch;
  /** Extra headers attached to every request. */
  defaultHeaders?: Record<string, string>;
}

/**
 * Low-level HTTP client wrapping fetch with:
 *  - JSON request/response handling
 *  - Backend envelope unwrapping ({ success, data })
 *  - Typed error hierarchy (ApiError, UnauthorizedError, ValidationError, …)
 *  - Auth header injection
 *  - Credentials-included (cookies) by default
 *
 * Method-specific endpoints live in `./endpoints/`.
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly getAuthToken?: ApiClientOptions['getAuthToken'];
  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.getAuthToken = options.getAuthToken;
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.defaultHeaders = options.defaultHeaders ?? {};
  }

  async get<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    return this.request<T>('GET', path, undefined, opts);
  }

  async post<T>(path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
    return this.request<T>('POST', path, body, opts);
  }

  async put<T>(path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
    return this.request<T>('PUT', path, body, opts);
  }

  async patch<T>(path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
    return this.request<T>('PATCH', path, body, opts);
  }

  async delete<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    return this.request<T>('DELETE', path, undefined, opts);
  }

  private async request<T>(
    method: string,
    path: string,
    body: unknown,
    opts: RequestOptions,
  ): Promise<T> {
    const url = `${opts.baseUrl ?? this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    const token = await this.getAuthToken?.();

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...this.defaultHeaders,
      ...opts.headers,
    };
    if (body !== undefined && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method,
        headers,
        body:
          body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
        credentials: opts.skipCredentials ? 'omit' : 'include',
        signal: opts.signal,
      });
    } catch (err) {
      throw new NetworkError('Failed to reach Wasalni API', err);
    }

    // Empty body 204
    if (response.status === 204) {
      return undefined as T;
    }

    let envelope: ApiEnvelope<T> | undefined;
    const text = await response.text();
    if (text) {
      try {
        envelope = JSON.parse(text) as ApiEnvelope<T>;
      } catch {
        // Non-JSON response — fall through to status-based error
      }
    }

    if (!response.ok) {
      const payload: ApiErrorPayload | undefined =
        envelope && 'error' in envelope
          ? { error: envelope.error, code: envelope.code, details: envelope.details }
          : undefined;

      switch (response.status) {
        case 401:
          throw new UnauthorizedError(url, payload);
        case 422:
          throw new ValidationError(url, payload);
        case 429: {
          const retryAfter = Number(response.headers.get('Retry-After')) || undefined;
          throw new RateLimitError(url, retryAfter, payload);
        }
        default:
          throw new ApiError(payload?.error ?? `HTTP ${response.status}`, {
            status: response.status,
            url,
            code: payload?.code,
            details: payload?.details,
          });
      }
    }

    if (!envelope) {
      throw new ApiError('Empty response from API', { status: response.status, url });
    }
    if (envelope.success === false) {
      throw new ApiError(envelope.error, {
        status: response.status,
        url,
        code: envelope.code,
        details: envelope.details,
      });
    }
    return envelope.data;
  }
}
