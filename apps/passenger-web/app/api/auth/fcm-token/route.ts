import 'server-only';
import type { NextRequest } from 'next/server';
import { AuthEndpoints } from '@wasalni/api-client';
import { fcmTokenSchema } from '@wasalni/schemas';
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
  const parsed = await parseJson(req, fcmTokenSchema);
  if (parsed.kind === 'error') return parsed.response;

  try {
    await new AuthEndpoints(backend).registerFcmToken(parsed.data.token, parsed.data.platform);
    return ok({ ok: true });
  } catch (err) {
    return translateBackendError(err);
  }
}
