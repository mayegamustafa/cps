'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001';

/**
 * Client-side gate for the admin panel: requires a valid session token and
 * verifies it against the API. Redirects to /admin/login otherwise. (The API
 * also enforces RBAC on every mutating endpoint — this is the UX layer.)
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<'checking' | 'ok'>('checking');

  useEffect(() => {
    const token = sessionStorage.getItem('cps_token');
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.ok) {
          setState('ok');
        } else {
          sessionStorage.removeItem('cps_token');
          router.replace('/admin/login');
        }
      } catch {
        // API unreachable: don't expose the panel.
        if (!cancelled) router.replace('/admin/login');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (state === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper-dark/40 text-ink-muted">
        Verifying access…
      </div>
    );
  }

  return <>{children}</>;
}
