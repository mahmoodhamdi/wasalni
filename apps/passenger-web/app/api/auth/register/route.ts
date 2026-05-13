import 'server-only';
import type { NextRequest } from 'next/server';
import { AuthEndpoints } from '@wasalni/api-client';
import { setSession } from '@wasalni/auth/next';
import { passengerRegisterSchema } from '@wasalni/schemas';
import { backend } from '../../../../lib/server/backend';
import { ok, parseJson, translateBackendError } from '../../../../lib/server/route-helpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, passengerRegisterSchema);
  if (parsed.kind === 'error') return parsed.response;

  try {
    const auth = new AuthEndpoints(backend);
    const session = await auth.registerPassenger(parsed.data);
    await setSession(session.token);
    return ok({ user: session.user });
  } catch (err) {
    return translateBackendError(err);
  }
}
