import 'server-only';
import type { NextRequest } from 'next/server';
import { AuthEndpoints } from '@wasalni/api-client';
import { clearSession } from '@wasalni/auth/next';
import { backend } from '../../../../lib/server/backend';
import { ok, requireCsrf } from '../../../../lib/server/route-helpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const csrf = requireCsrf(req);
  if (csrf) return csrf;

  try {
    // Best effort — clear local session even if the backend logout fails.
    await new AuthEndpoints(backend).logout();
  } catch {
    // intentionally ignored
  }
  await clearSession();
  return ok({ ok: true });
}
