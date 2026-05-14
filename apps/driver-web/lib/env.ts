function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(value: string | undefined, fallback: string): string {
  return value && value.length > 0 ? value : fallback;
}

export const env = {
  apiUrl: optional(process.env.NEXT_PUBLIC_API_URL, 'http://localhost:3000/api/v1'),
  socketUrl: optional(process.env.NEXT_PUBLIC_SOCKET_URL, 'http://localhost:3000'),
  appUrl: optional(process.env.NEXT_PUBLIC_APP_URL, 'http://localhost:3200'),
} as const;

export const serverEnv = {
  backendUrl: () => required('BACKEND_URL', process.env.BACKEND_URL),
  sessionSecret: () => required('SESSION_SECRET', process.env.SESSION_SECRET),
} as const;
