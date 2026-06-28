'use client';

/**
 * Centralized admin session management.
 *
 * - Access token lives in sessionStorage ('cps_token') — compatible with the
 *   existing components that read it directly.
 * - Refresh token lives in localStorage ('cps_refresh') so the session survives
 *   reloads and syncs across tabs.
 * - A fetch interceptor (installed by AdminGuard) keeps every /api call
 *   authenticated and silently refreshes on/just-before expiry, eliminating the
 *   "please login" / "unauthorized" flashes mid-session.
 */

const ACCESS_KEY = 'cps_token';
const EXP_KEY = 'cps_token_exp';
const REFRESH_KEY = 'cps_refresh';
const SKEW_MS = 60_000; // refresh a minute before expiry

export type Session = { accessToken: string; refreshToken?: string; expiresIn?: number };

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(ACCESS_KEY);
}

export function hasRefresh(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(REFRESH_KEY));
}

export function setSession(s: Session) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ACCESS_KEY, s.accessToken);
  if (s.expiresIn) sessionStorage.setItem(EXP_KEY, String(Date.now() + s.expiresIn * 1000));
  if (s.refreshToken) localStorage.setItem(REFRESH_KEY, s.refreshToken);
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(EXP_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function expiresAt(): number {
  const v = typeof window !== 'undefined' ? sessionStorage.getItem(EXP_KEY) : null;
  return v ? Number(v) : 0;
}

let inFlight: Promise<boolean> | null = null;

/** Exchanges the refresh token for a fresh pair. Single-flight + safe. */
export async function refreshSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (inFlight) return inFlight;
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return false;
  inFlight = (async () => {
    try {
      const res = await window.fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) { clearSession(); return false; }
      const data = await res.json();
      if (!data?.accessToken) { clearSession(); return false; }
      setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, expiresIn: data.expiresIn });
      return true;
    } catch {
      return false; // network blip: keep the session, retry later
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Refreshes proactively when the access token is missing or near expiry. */
export async function ensureFreshToken(): Promise<void> {
  if (typeof window === 'undefined') return;
  const exp = expiresAt();
  const needs = !getAccessToken() || (exp && Date.now() > exp - SKEW_MS);
  if (needs && hasRefresh()) await refreshSession();
}

export function msUntilRefresh(): number {
  const exp = expiresAt();
  if (!exp) return 5 * 60_000;
  return Math.max(15_000, exp - Date.now() - SKEW_MS);
}

const SKIP = ['/api/auth/login', '/api/auth/refresh'];

/** Patches window.fetch so admin /api calls stay authenticated and auto-refresh
 *  on 401. Returns an uninstaller. */
export function installAuthFetch(): () => void {
  if (typeof window === 'undefined') return () => {};
  const original = window.fetch.bind(window);

  const isApi = (url: string) => url.startsWith('/api/') && !SKIP.some((s) => url.startsWith(s));

  const patched: typeof window.fetch = async (input, init) => {
    // Only handle string/URL inputs (covers all app calls); pass Request through.
    const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname + input.search : null;
    if (url === null || !isApi(url)) return original(input as RequestInfo, init);

    await ensureFreshToken();
    const token = getAccessToken();
    const withAuth = (t: string | null): RequestInit => {
      const headers = new Headers(init?.headers || {});
      if (t) headers.set('Authorization', `Bearer ${t}`);
      return { ...init, headers };
    };

    let res = await original(url, withAuth(token));
    if (res.status === 401 && hasRefresh()) {
      const ok = await refreshSession();
      if (ok) res = await original(url, withAuth(getAccessToken()));
    }
    return res;
  };

  window.fetch = patched;
  return () => { window.fetch = original; };
}
