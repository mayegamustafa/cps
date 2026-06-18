'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';

export default function AdminLoginPage() {
  const router = useRouter();
  const [needs2fa, setNeeds2fa] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001'}/api/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(body.message) ? body.message.join(', ') : String(body.message ?? '');
        if (/two-factor/i.test(msg) && !needs2fa) {
          setNeeds2fa(true); // server is requesting the second factor
          setLoading(false);
          return;
        }
        setError(msg && !/^invalid credentials$/i.test(msg) ? msg : 'Invalid email or password.');
        setLoading(false);
        return;
      }
      if (body.accessToken) sessionStorage.setItem('cps_token', body.accessToken);
      router.push('/admin');
    } catch {
      setError('Cannot reach the server. Make sure the API is running (pnpm dev:api).');
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-maroon-950 p-12 text-white lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=70')" }}
        />
        <div className="relative"><Logo tone="light" /></div>
        <div className="relative max-w-md">
          <h1 className="font-display text-4xl !text-white">Administration Portal</h1>
          <p className="mt-4 text-paper/70">
            Manage news, admissions, careers, media, live streams and more, the
            control plane for the City Parents School platform.
          </p>
        </div>
        <p className="relative text-sm text-paper/50">Secured with JWT, RBAC and two-factor authentication.</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-paper p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden"><Logo /></div>
          <h2 className="mt-6 text-2xl">Sign in</h2>
          <p className="mt-1 text-sm text-ink-soft">Use your administrator credentials.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <Field label="Email" id="email" name="email" type="email" required defaultValue="admin@cityparents.sc.ug" />
            <Field label="Password" id="password" name="password" type="password" required defaultValue="" placeholder="••••••••" />
            {needs2fa ? (
              <Field label="Two-factor code" id="totp" name="totp" inputMode="numeric" required hint="Enter the 6-digit code from your authenticator app." />
            ) : null}
            {error ? <p className="text-sm text-maroon-600">{error}</p> : null}
            <Button type="submit" size="lg" icon="arrow-right" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : needs2fa ? 'Verify & sign in' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 flex items-center gap-2 text-xs text-ink-muted">
            <Icon name="shield-check" size={16} className="text-maroon-600" />
            Protected area. Unauthorised access is prohibited.
          </p>
        </div>
      </div>
    </main>
  );
}
