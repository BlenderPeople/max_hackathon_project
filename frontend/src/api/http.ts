export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let sessionToken: string | null = null;
let pendingLogin: Promise<void> | null = null;

export function authenticateMax(initData: string): Promise<void> {
  if (sessionToken) return Promise.resolve();
  if (pendingLogin) return pendingLogin;
  pendingLogin = fetch('/api/auth/max', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ init_data: initData }),
  }).then(async (response) => {
    if (!response.ok) throw new ApiError(response.status, await response.text());
    const data = await response.json() as { session_token: string };
    sessionToken = data.session_token;
  }).finally(() => { pendingLogin = null; });
  return pendingLogin;
}

/**
 * Shared API boundary. Feature components must use a feature hook/service,
 * never call fetch directly.
 */
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message || 'Request failed');
  }

  return response.json() as Promise<T>;
}

export async function requestBlob(path: string): Promise<Blob> {
  const response = await fetch(`/api${path}`, {
    headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
  });
  if (!response.ok) throw new ApiError(response.status, await response.text());
  return response.blob();
}
