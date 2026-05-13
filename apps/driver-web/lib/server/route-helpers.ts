import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, type ZodType } from 'zod';
import { ApiError, NetworkError } from '@wasalni/api-client';
import { validateCsrf } from '@wasalni/auth/next';

/**
 * Parse the request JSON body against a Zod schema. Returns either
 * `{ ok: true, data }` or an early NextResponse describing the validation
 * failure.
 */
export type ParseResult<T> =
  | { kind: 'parsed'; data: T }
  | { kind: 'error'; response: NextResponse };

export async function parseJson<T>(req: NextRequest, schema: ZodType<T>): Promise<ParseResult<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      kind: 'error',
      response: NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 }),
    };
  }
  try {
    return { kind: 'parsed', data: schema.parse(raw) };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        kind: 'error',
        response: NextResponse.json(
          { success: false, error: 'Validation failed', details: err.issues },
          { status: 422 },
        ),
      };
    }
    return {
      kind: 'error',
      response: NextResponse.json(
        { success: false, error: 'Unexpected validation error' },
        { status: 500 },
      ),
    };
  }
}

/** Enforce CSRF on state-changing requests. */
export function requireCsrf(req: NextRequest): NextResponse | null {
  if (!validateCsrf(req)) {
    return NextResponse.json({ success: false, error: 'CSRF token missing' }, { status: 403 });
  }
  return null;
}

/**
 * Translate backend errors into the Wasalni Route Handler response shape.
 * Keeps the status code from the backend so the client can branch.
 */
export function translateBackendError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code, details: err.details },
      { status: err.status },
    );
  }
  if (err instanceof NetworkError) {
    return NextResponse.json({ success: false, error: 'Backend unreachable' }, { status: 502 });
  }
  return NextResponse.json({ success: false, error: 'Unexpected server error' }, { status: 500 });
}

/** Standard success envelope mirroring the backend. */
export function ok<T>(data: T, init: ResponseInit = {}): NextResponse {
  return NextResponse.json({ success: true, data }, init);
}
