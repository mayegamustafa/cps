/**
 * API base resolution.
 *
 * Browser code calls the SAME ORIGIN (`/api/...`) which the Next server proxies
 * to the backend (see app/api/[...path]/route.ts). This removes CORS and the
 * need to bake a public API URL into the client bundle.
 *
 * Server code (server components + the proxy) calls the backend directly via
 * serverApi(), which reads API_ORIGIN (preferred) or NEXT_PUBLIC_API_URL at
 * runtime and tolerates a missing https:// scheme.
 */

export function normalizeOrigin(u?: string | null): string {
  const t = (u ?? '').trim().replace(/\/+$/, '');
  if (!t) return '';
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/** Absolute backend origin for server-side fetches and the /api proxy. */
export function serverApi(): string {
  return (
    normalizeOrigin(process.env.API_ORIGIN || process.env.NEXT_PUBLIC_API_URL) ||
    'http://localhost:4001'
  );
}
