import 'server-only';
import type { NextRequest } from 'next/server';
import { TripsEndpoints } from '@wasalni/api-client';
import { bookTripSchema } from '@wasalni/schemas';
import { backend } from '../../../lib/server/backend';
import {
  ok,
  parseJson,
  requireCsrf,
  translateBackendError,
} from '../../../lib/server/route-helpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const parsed = await parseJson(req, bookTripSchema);
  if (parsed.kind === 'error') return parsed.response;

  try {
    const trip = await new TripsEndpoints(backend).book(parsed.data);
    return ok(trip);
  } catch (err) {
    return translateBackendError(err);
  }
}

export async function GET(req: NextRequest) {
  const page = Number(req.nextUrl.searchParams.get('page') ?? 1);
  const limit = Number(req.nextUrl.searchParams.get('limit') ?? 20);
  try {
    const page$ = Number.isFinite(page) && page > 0 ? page : 1;
    const limit$ = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 50) : 20;
    const trips = await new TripsEndpoints(backend).list(page$, limit$);
    return ok(trips);
  } catch (err) {
    return translateBackendError(err);
  }
}
