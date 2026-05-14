import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { PlacesEndpoints } from '@wasalni/api-client';
import { placeSearchSchema } from '@wasalni/schemas';
import { backend } from '../../../../lib/server/backend';
import { ok, translateBackendError } from '../../../../lib/server/route-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) {
    return ok([]);
  }
  const limit = Number(req.nextUrl.searchParams.get('limit') ?? 8);
  const latStr = req.nextUrl.searchParams.get('lat');
  const lngStr = req.nextUrl.searchParams.get('lng');

  const parsed = placeSearchSchema.safeParse({
    query: q,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 20) : 8,
    near:
      latStr && lngStr
        ? { latitude: parseFloat(latStr), longitude: parseFloat(lngStr) }
        : undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid search', details: parsed.error.issues },
      { status: 422 },
    );
  }

  try {
    const places = await new PlacesEndpoints(backend).search(parsed.data);
    return ok(places);
  } catch (err) {
    return translateBackendError(err);
  }
}
