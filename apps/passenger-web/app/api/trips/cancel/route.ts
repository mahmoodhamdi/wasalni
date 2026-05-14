import 'server-only';
import type { NextRequest } from 'next/server';
import { TripsEndpoints } from '@wasalni/api-client';
import { cancelTripSchema } from '@wasalni/schemas';
import { backend } from '../../../../lib/server/backend';
import {
  ok,
  parseJson,
  requireCsrf,
  translateBackendError,
} from '../../../../lib/server/route-helpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const parsed = await parseJson(req, cancelTripSchema);
  if (parsed.kind === 'error') return parsed.response;

  try {
    const trip = await new TripsEndpoints(backend).cancel(parsed.data);
    return ok(trip);
  } catch (err) {
    return translateBackendError(err);
  }
}
