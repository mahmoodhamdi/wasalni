import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { TripsEndpoints } from '@wasalni/api-client';
import { ratingSchema } from '@wasalni/schemas';
import { backend } from '../../../../../lib/server/backend';
import {
  ok,
  parseJson,
  requireCsrf,
  translateBackendError,
} from '../../../../../lib/server/route-helpers';

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
  const parsed = await parseJson(
    req,
    ratingSchema
      .extend({ tripId: ratingSchema.shape.tripId.default(id) })
      .pick({ score: true, comment: true }),
  );
  if (parsed.kind === 'error') return parsed.response;

  try {
    const trip = await new TripsEndpoints(backend).rate({ tripId: id, ...parsed.data });
    return ok(trip);
  } catch (err) {
    return translateBackendError(err);
  }
}
