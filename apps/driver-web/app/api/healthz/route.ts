import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    app: 'driver-web',
    ts: new Date().toISOString(),
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
