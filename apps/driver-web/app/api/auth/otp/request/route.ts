import 'server-only';
import type { NextRequest } from 'next/server';
import { AuthEndpoints } from '@wasalni/api-client';
import { requestOtpSchema } from '@wasalni/schemas';
import { backend } from '../../../../../lib/server/backend';
import { ok, parseJson, translateBackendError } from '../../../../../lib/server/route-helpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, requestOtpSchema);
  if (parsed.kind === 'error') return parsed.response;

  try {
    const auth = new AuthEndpoints(backend);
    const data = await auth.requestOtp(parsed.data);
    return ok(data);
  } catch (err) {
    return translateBackendError(err);
  }
}
