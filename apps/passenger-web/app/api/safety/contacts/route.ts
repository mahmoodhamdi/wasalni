import 'server-only';
import type { NextRequest } from 'next/server';
import { SafetyEndpoints } from '@wasalni/api-client';
import { emergencyContactSchema } from '@wasalni/schemas';
import { backend } from '../../../../lib/server/backend';
import {
  ok,
  parseJson,
  requireCsrf,
  translateBackendError,
} from '../../../../lib/server/route-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const contacts = await new SafetyEndpoints(backend).listContacts();
    return ok(contacts);
  } catch (err) {
    return translateBackendError(err);
  }
}

export async function POST(req: NextRequest) {
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const parsed = await parseJson(req, emergencyContactSchema);
  if (parsed.kind === 'error') return parsed.response;

  try {
    const contact = await new SafetyEndpoints(backend).addContact(parsed.data);
    return ok(contact);
  } catch (err) {
    return translateBackendError(err);
  }
}
