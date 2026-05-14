import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

/**
 * Serves the Serwist-generated service worker at `/sw.js`. Reads the file
 * from `public/sw.js` at request time. We use a Route Handler (instead of
 * relying on static serving from public/) because Next 16 doesn't reliably
 * serve runtime-generated .js files from public/ alongside an app-router
 * catch-all locale segment.
 *
 * The Service-Worker-Allowed header lets the SW claim the entire origin
 * (`/`) instead of being limited to `/api/sw`.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const swPath = path.join(process.cwd(), 'public', 'sw.js');
    const buf = await fs.readFile(swPath);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Service-Worker-Allowed': '/',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'service-worker-not-built' },
      { status: 404 },
    );
  }
}

export const dynamic = 'force-dynamic';
