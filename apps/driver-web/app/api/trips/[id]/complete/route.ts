import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { backend } from '../../../../../lib/server/backend';
import { ok, requireCsrf, translateBackendError } from '../../../../../lib/server/route-helpers';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const { id } = await ctx.params;
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return NextResponse.json({ success: false, error: 'Invalid trip id' }, { status: 400 });
  }
  try {
    const trip = await backend.post(`/trips/${id}/complete`);
    return ok(trip);
  } catch (err) {
    return translateBackendError(err);
  }
}
