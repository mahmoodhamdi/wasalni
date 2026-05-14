import 'server-only';
import type { NextResponse } from 'next/server';
import { DriverEndpoints } from '@wasalni/api-client';
import { backend } from '../../../../../lib/server/backend';
import { ok, translateBackendError } from '../../../../../lib/server/route-helpers';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const summary = await new DriverEndpoints(backend).earningsSummary();
    return ok(summary);
  } catch (err) {
    return translateBackendError(err);
  }
}
