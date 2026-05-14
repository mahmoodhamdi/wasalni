import 'server-only';
import { NextResponse } from 'next/server';
import { backend } from '../../../../../lib/server/backend';
import { ok, translateBackendError } from '../../../../../lib/server/route-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return NextResponse.json({ success: false, error: 'Invalid trip id' }, { status: 400 });
  }
  try {
    // Read-only, redacted projection from the backend.
    const trip = await backend.get(`/trips/${id}/share`);
    return ok(trip);
  } catch (err) {
    return translateBackendError(err);
  }
}
