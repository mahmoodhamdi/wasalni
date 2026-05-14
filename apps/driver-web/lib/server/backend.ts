import 'server-only';
import { createBackendClient } from '@wasalni/auth/next';

const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000/api/v1';

/**
 * Singleton server-side ApiClient for this app. Reads the session JWT from
 * the httpOnly cookie automatically.
 */
export const backend = createBackendClient(backendUrl);
