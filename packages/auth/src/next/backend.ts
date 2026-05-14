import { ApiClient } from '@wasalni/api-client';
import { getSessionToken } from './session';

/**
 * Server-side ApiClient pointing at the Wasalni backend. Reads the JWT from
 * the httpOnly cookie and forwards it as a `Authorization: Bearer …` header.
 *
 * Use inside Route Handlers and Server Components. NEVER expose this to the
 * client — the JWT must not leak to JavaScript.
 */
export function createBackendClient(backendUrl: string): ApiClient {
  return new ApiClient({
    baseUrl: backendUrl,
    getAuthToken: async () => getSessionToken(),
  });
}
