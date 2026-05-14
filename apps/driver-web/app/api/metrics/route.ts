import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const payload = await req.json();
    console.info(JSON.stringify({ kind: 'metric', app: 'driver-web', ...payload }));
  } catch {
    // ignored
  }
  return new NextResponse(null, { status: 204 });
}
