'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';

const API = ''; // same-origin; proxied to the backend by app/api/[...path]/route.ts

export default function SetupPage() {
  const [status, setStatus] = useState<'checking' | 'ready' | 'done' | 'working' | 'error'>('checking');
  const [adminExists, setAdminExists] = useState(false);
  const [result, setResult] = useState<{ adminEmail?: string; message?: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/setup/status`);
        const data = await res.json();
        setAdminExists(!!data.adminExists);
        setStatus('ready');
      } catch {
        setStatus('error');
        setError('Cannot reach the API. Make sure the API service is running and API_ORIGIN is set on the web service.');
      }
    })();
  }, []);

  async function seed() {
    setStatus('working');
    setError('');
    try {
      const res = await fetch(`${API}/api/setup/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Seeding failed.');
        setStatus('error');
        return;
      }
      setResult(data);
      setStatus('done');
    } catch {
      setError('Cannot reach the API.');
      setStatus('error');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-white p-8 shadow-soft">
        <Logo />
        <h1 className="mt-6 text-2xl">Platform setup</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Seed the database with the administrator account and baseline content.
          Run this once after deploying.
        </p>

        {status === 'checking' ? <p className="mt-6 text-ink-muted">Checking status…</p> : null}

        {status === 'ready' ? (
          <div className="mt-6">
            <div className="rounded-xl bg-paper-dark p-4 text-sm">
              {adminExists ? (
                <p className="flex items-start gap-2 text-ink-soft">
                  <Icon name="shield-check" size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>
                    An administrator already exists. If you can&rsquo;t sign in, set
                    <code className="mx-1 rounded bg-white px-1.5 py-0.5">SEED_ADMIN_PASSWORD</code>
                    on the API service and click below to reset the admin password to it.
                  </span>
                </p>
              ) : (
                <p className="flex items-center gap-2 text-ink-soft">
                  <Icon name="bell" size={18} className="text-maroon-600" />
                  No administrator found yet. Click below to seed the database.
                </p>
              )}
            </div>
            <Button onClick={seed} size="lg" icon="arrow-right" className="mt-5 w-full">
              {adminExists ? 'Seed / reset admin password' : 'Seed database'}
            </Button>
          </div>
        ) : null}

        {status === 'working' ? <p className="mt-6 text-ink-muted">Seeding…</p> : null}

        {status === 'done' ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="flex items-center gap-2 text-lg text-emerald-800">
              <Icon name="shield-check" size={20} /> Done
            </h2>
            <p className="mt-2 text-sm text-emerald-900">{result?.message}</p>
            {result?.adminEmail ? (
              <p className="mt-3 text-sm">
                Sign in with <strong>{result.adminEmail}</strong> and the password set in
                <code className="mx-1 rounded bg-white px-1.5 py-0.5">SEED_ADMIN_PASSWORD</code>
                (default <code className="rounded bg-white px-1.5 py-0.5">ChangeMe123!</code>).
              </p>
            ) : null}
            <Button href="/admin/login" className="mt-5" icon="arrow-right">Go to login</Button>
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="mt-6">
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>
            <Button onClick={() => location.reload()} variant="outline" className="mt-4">Try again</Button>
          </div>
        ) : null}

        <p className="mt-6 text-center text-xs text-ink-muted">
          <Link href="/admin/login" className="hover:text-maroon-700">Back to login</Link>
        </p>
      </div>
    </main>
  );
}
