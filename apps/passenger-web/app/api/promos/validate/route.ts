import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { PromosEndpoints } from '@wasalni/api-client';
import { backend } from '../../../../lib/server/backend';
import { ok, translateBackendError } from '../../../../lib/server/route-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const code = req.nextUrl.searchParams.get('code');
  if (!code || code.length > 16) {
    return NextResponse.json({ success: false, error: 'Invalid promo code' }, { status: 400 });
  }
  try {
    const result = await new PromosEndpoints(backend).validate(code);
    return ok(result);
  } catch (err) {
    return translateBackendError(err);
  }
}
