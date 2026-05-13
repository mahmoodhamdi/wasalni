import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { SafetyEndpoints } from '@wasalni/api-client';
import { emergencyContactSchema } from '@wasalni/schemas';
import { backend } from '../../../../../lib/server/backend';
import {
  ok,
  parseJson,
  requireCsrf,
  translateBackendError,
} from '../../../../../lib/server/route-helpers';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
  const parsed = await parseJson(req, emergencyContactSchema);
  if (parsed.kind === 'error') return parsed.response;

  try {
    const contact = await new SafetyEndpoints(backend).updateContact(id, parsed.data);
    return ok(contact);
  } catch (err) {
    return translateBackendError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

  try {
    await new SafetyEndpoints(backend).deleteContact(id);
    return ok({ ok: true });
  } catch (err) {
    return translateBackendError(err);
  }
}
