import 'server-only';
import type { NextRequest } from 'next/server';
import { AuthEndpoints } from '@wasalni/api-client';
import { updateProfileSchema } from '@wasalni/schemas';
import { backend } from '../../../../lib/server/backend';
import {
  ok,
  parseJson,
  requireCsrf,
  translateBackendError,
} from '../../../../lib/server/route-helpers';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const parsed = await parseJson(req, updateProfileSchema);
  if (parsed.kind === 'error') return parsed.response;

  try {
    const user = await new AuthEndpoints(backend).updateProfile(parsed.data);
    return ok(user);
  } catch (err) {
    return translateBackendError(err);
  }
}
