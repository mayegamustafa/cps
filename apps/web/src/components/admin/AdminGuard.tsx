'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  installAuthFetch,
  ensureFreshToken,
  refreshSession,
  getAccessToken,
  hasRefresh,
  clearSession,
  msUntilRefresh,
} from '@/lib/admin-auth';

/**
 * Admin session gate + keeper. Installs the auth-aware fetch interceptor,
 * hydrates/refreshes the session, proactively renews the access token before it
 * expires, and synchronizes login/logout across tabs. Redirects to login only
 * when there is genuinely no valid session — never mid-session.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<'checking' | 'ok'>('checking');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const uninstall = installAuthFetch();
    let cancelled = false;

    const toLogin = () => {
      clearSession();
      const next = encodeURIComponent(pathname || '/admin');
      router.replace(`/admin/login?next=${next}`);
    };

    const scheduleRenew = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        await refreshSession();
        if (!cancelled) scheduleRenew();
      }, msUntilRefresh());
    };

    (async () => {
      // Establish a valid access token (refresh if needed).
      if (!getAccessToken() && hasRefresh()) await refreshSession();
      else await ensureFreshToken();
      if (cancelled) return;
      if (!getAccessToken()) { toLogin(); return; }

      // Confirm with the server (also catches revoked sessions).
      try {
        const res = await fetch('/api/auth/me');
        if (cancelled) return;
        if (res.ok) { setState('ok'); scheduleRenew(); }
        else toLogin();
      } catch {
        // Network blip — don't lock the user out if we already have a token.
        if (!cancelled) setState('ok');
      }
    })();

    // Renew when the tab regains focus (covers laptop sleep / long idle).
    const onFocus = () => { void ensureFreshToken(); };
    // Cross-tab logout: if the refresh token is cleared elsewhere, sign out here too.
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cps_refresh' && !e.newValue) toLogin();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
      uninstall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper-dark/40 text-ink-muted">
        Verifying access…
      </div>
    );
  }

  return <>{children}</>;
}
