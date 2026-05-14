import 'server-only';
import type { NextRequest } from 'next/server';
import { SafetyEndpoints } from '@wasalni/api-client';
import { sosTriggerSchema } from '@wasalni/schemas';
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
  const parsed = await parseJson(req, sosTriggerSchema);
  if (parsed.kind === 'error') return parsed.response;

  try {
    const result = await new SafetyEndpoints(backend).sos(parsed.data);
    return ok(result);
  } catch (err) {
    return translateBackendError(err);
  }
}
