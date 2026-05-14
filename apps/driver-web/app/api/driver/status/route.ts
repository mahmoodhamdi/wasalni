import 'server-only';
import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { DriverEndpoints } from '@wasalni/api-client';
import { backend } from '../../../../lib/server/backend';
import {
  ok,
  parseJson,
  requireCsrf,
  translateBackendError,
} from '../../../../lib/server/route-helpers';

const statusSchema = z.object({ status: z.enum(['online', 'offline', 'busy']) });

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const parsed = await parseJson(req, statusSchema);
  if (parsed.kind === 'error') return parsed.response;

  try {
    const data = await new DriverEndpoints(backend).setStatus(parsed.data.status);
    return ok(data);
  } catch (err) {
    return translateBackendError(err);
  }
}
