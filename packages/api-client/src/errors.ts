/**
 * Typed error hierarchy for the Wasalni API client. The backend returns
 * an error envelope like:
 *   { success: false, error: string, code?: string, details?: unknown }
 * — we surface that as a discriminated error class so callers can match
 * on `instanceof ApiError` and on `error.status` cleanly.
 */

export interface ApiErrorPayload {
  error: string;
  code?: string;
  details?: unknown;
}

export class ApiError extends Error {
  public override readonly name: string = 'ApiError';
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly url: string;

  constructor(
    message: string,
    init: { status: number; url: string; code?: string; details?: unknown },
  ) {
    super(message);
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
    this.url = init.url;
  }
}

export class NetworkError extends Error {
  public override readonly name = 'NetworkError';
  public override readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class UnauthorizedError extends ApiError {
  public override readonly name = 'UnauthorizedError';
  constructor(url: string, payload?: ApiErrorPayload) {
    super(payload?.error ?? 'Unauthorized', {
      status: 401,
      url,
      code: payload?.code,
      details: payload?.details,
    });
  }
}

export class ValidationError extends ApiError {
  public override readonly name = 'ValidationError';
  constructor(url: string, payload?: ApiErrorPayload) {
    super(payload?.error ?? 'Validation failed', {
      status: 422,
      url,
      code: payload?.code,
      details: payload?.details,
    });
  }
}

export class RateLimitError extends ApiError {
  public override readonly name = 'RateLimitError';
  public readonly retryAfter?: number;
  constructor(url: string, retryAfter?: number, payload?: ApiErrorPayload) {
    super(payload?.error ?? 'Too many requests', {
      status: 429,
      url,
      code: payload?.code,
      details: payload?.details,
    });
    this.retryAfter = retryAfter;
  }
}
