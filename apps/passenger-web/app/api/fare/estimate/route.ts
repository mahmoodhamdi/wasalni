import 'server-only';
import type { NextRequest } from 'next/server';
import { FareEndpoints } from '@wasalni/api-client';
import { fareEstimateSchema } from '@wasalni/schemas';
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
  const parsed = await parseJson(req, fareEstimateSchema);
  if (parsed.kind === 'error') return parsed.response;

  try {
    const data = await new FareEndpoints(backend).estimate(parsed.data);
    return ok(data);
  } catch (err) {
    return translateBackendError(err);
  }
}
