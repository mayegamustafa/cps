'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Icon } from '@/components/Icon';

const API = ''; // same-origin; proxied to the backend by app/api/[...path]/route.ts

export default function SetupPage() {
  const [phase, setPhase] = useState<'checking' | 'ready' | 'error'>('checking');
  const [adminEmail, setAdminEmail] = useState('admin@cityparents.ac.ug');
  const [adminExists, setAdminExists] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/setup/status`);
        const data = await res.json();
        setAdminExists(!!data.adminExists);
        if (data.adminEmail) setAdminEmail(data.adminEmail);
        setPhase('ready');
      } catch {
        setPhase('error');
        setError('Cannot reach the API. Make sure the API service is running and API_ORIGIN is set on the web service.');
      }
    })();
  }, []);

  async function seed() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/setup/seed`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await res.json();
      if (!res.ok) setError(data.message ?? 'Seeding failed.');
      else setAdminExists(true);
    } catch {
      setError('Cannot reach the API.');
    }
    setBusy(false);
  }

  async function setAdminPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/setup/reset-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Could not set the password.');
      } else {
        setDone({ email: data.email ?? adminEmail, password });
      }
    } catch {
      setError('Cannot reach the API.');
    }
    setBusy(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-white p-8 shadow-soft">
        <Logo />
        <h1 className="mt-6 text-2xl">Platform setup</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Seed the database and set the administrator login. Use this once after deploying.
        </p>

        {phase === 'checking' ? <p className="mt-6 text-ink-muted">Checking status…</p> : null}

        {done ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="flex items-center gap-2 text-lg text-emerald-800">
              <Icon name="shield-check" size={20} /> Admin ready
            </h2>
            <p className="mt-2 text-sm text-emerald-900">Sign in with these exact credentials:</p>
            <div className="mt-3 space-y-1 rounded-lg bg-white p-3 font-mono text-sm">
              <div>Email: <strong>{done.email}</strong></div>
              <div>Password: <strong>{done.password}</strong></div>
            </div>
            <Button href="/admin/login" className="mt-5" icon="arrow-right">Go to login</Button>
          </div>
        ) : phase === 'ready' ? (
          <div className="mt-6 space-y-6">
            {!adminExists ? (
              <div>
                <p className="mb-3 flex items-center gap-2 text-sm text-ink-soft">
                  <Icon name="bell" size={18} className="text-maroon-600" />
                  No administrator yet. Seed the database first.
                </p>
                <Button onClick={seed} size="lg" icon="arrow-right" className="w-full" disabled={busy}>
                  {busy ? 'Seeding…' : 'Seed database'}
                </Button>
              </div>
            ) : null}

            <form onSubmit={setAdminPassword} className="space-y-3 border-t border-line pt-6">
              <p className="text-sm text-ink-soft">
                Set the administrator password. You&rsquo;ll log in with this exact value.
              </p>
              <div className="rounded-lg bg-paper-dark px-3 py-2 text-sm">
                Admin email: <strong>{adminEmail}</strong>
              </div>
              <Field
                label="New admin password"
                id="pwd"
                type="text"
                value={password}
                required
                placeholder="At least 6 characters"
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" size="lg" icon="arrow-right" className="w-full" disabled={busy || password.length < 6}>
                {busy ? 'Saving…' : 'Set password & enable login'}
              </Button>
            </form>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
            ) : null}
          </div>
        ) : null}

        {phase === 'error' ? (
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
