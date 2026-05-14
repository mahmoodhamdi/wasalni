import 'server-only';
import { NextResponse } from 'next/server';
import { AuthEndpoints, UnauthorizedError } from '@wasalni/api-client';
import { backend } from '../../../../lib/server/backend';
import { ok, translateBackendError } from '../../../../lib/server/route-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = new AuthEndpoints(backend);
    const user = await auth.me();
    return ok(user);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
    }
    return translateBackendError(err);
  }
}
