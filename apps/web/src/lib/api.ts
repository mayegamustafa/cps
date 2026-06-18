/** Minimal typed fetch wrapper for the NestJS API. */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, data: unknown, token?: string) =>
    apiFetch<T>(path, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
};
