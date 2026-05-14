import { NextResponse } from 'next/server';

/**
 * Liveness probe for orchestrators (Docker, k8s, uptime monitors).
 * Returns 200 + minimal JSON when the Next.js process can respond.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    app: 'passenger-web',
    ts: new Date().toISOString(),
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
