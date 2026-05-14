import 'server-only';
import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { WalletEndpoints } from '@wasalni/api-client';
import { backend } from '../../../../../lib/server/backend';
import {
  ok,
  parseJson,
  requireCsrf,
  translateBackendError,
} from '../../../../../lib/server/route-helpers';

const withdrawSchema = z.object({
  amount: z.number().int().positive().max(100_000),
  method: z.string().trim().min(1).max(40).optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const parsed = await parseJson(req, withdrawSchema);
  if (parsed.kind === 'error') return parsed.response;

  try {
    const result = await new WalletEndpoints(backend).withdraw(parsed.data);
    return ok(result);
  } catch (err) {
    return translateBackendError(err);
  }
}
