import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Web Vitals + custom event sink. We log to stdout in JSON so structured
 * logging picks it up (Vercel/Cloudflare/Loki all happy). Forwarding to
 * Sentry/Honeycomb/etc. is a future swap of this body.
 *
 * Always returns 204 — the caller is best-effort beacon traffic. Never
 * surface errors to the user.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const payload = await req.json();
    console.info(JSON.stringify({ kind: 'metric', app: 'passenger-web', ...payload }));
  } catch {
    // ignored
  }
  return new NextResponse(null, { status: 204 });
}
