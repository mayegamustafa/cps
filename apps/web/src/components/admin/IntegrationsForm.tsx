'use client';

import { useEffect, useState } from 'react';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

type Integrations = {
  smtp?: {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    from?: string;
  };
  social?: {
    autoSync?: boolean;
    youtube?: { apiKey?: string; channelId?: string };
    instagram?: { accessToken?: string; userId?: string };
    facebook?: { pageId?: string; accessToken?: string };
  };
};

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-6">
      <h2 className="font-display text-lg text-maroon-900">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{desc}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function IntegrationsForm() {
  const [cfg, setCfg] = useState<Integrations>({ smtp: {}, social: { youtube: {}, instagram: {}, facebook: {} } });
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('loading');
  const [note, setNote] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/integrations', { headers: authHeaders() }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setCfg({
          smtp: data.smtp ?? {},
          social: {
            autoSync: data.social?.autoSync ?? false,
            youtube: data.social?.youtube ?? {},
            instagram: data.social?.instagram ?? {},
            facebook: data.social?.facebook ?? {},
          },
        });
        setStatus('idle');
      } else {
        setStatus('idle');
        setNote('Sign in as a super admin to manage integrations.');
      }
    })();
  }, []);

  function patch(updater: (d: Integrations) => void) {
    setCfg((prev) => {
      const next = structuredClone(prev);
      updater(next);
      return next;
    });
  }

  async function save() {
    setStatus('saving');
    const res = await fetch('/api/integrations', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(cfg),
    }).catch(() => null);
    if (res && res.ok) {
      // Re-read so masked secrets reflect the stored values.
      const data = await res.json();
      setCfg({
        smtp: data.smtp ?? {},
        social: {
          autoSync: data.social?.autoSync ?? false,
          youtube: data.social?.youtube ?? {},
          instagram: data.social?.instagram ?? {},
          facebook: data.social?.facebook ?? {},
        },
      });
      setStatus('saved');
    } else {
      setStatus('error');
    }
  }

  async function testEmail() {
    setNote('Sending test email…');
    const res = await fetch('/api/mail/test', { method: 'POST', headers: authHeaders(), body: '{}' }).catch(() => null);
    const data = res && res.ok ? await res.json() : null;
    setNote(data?.sent ? 'Test email sent — check your inbox.' : `Test failed: ${data?.error ?? 'unable to send'}`);
  }

  async function syncNow() {
    setNote('Syncing social posts…');
    const res = await fetch('/api/social/sync', { method: 'POST', headers: authHeaders() }).catch(() => null);
    const data = res && res.ok ? await res.json() : null;
    if (!data) setNote('Sync failed (sign in again).');
    else if (!data.configured?.length) setNote('No network tokens configured yet.');
    else setNote(`Synced ${data.upserted} post(s) from ${data.configured.join(', ')}.${data.errors?.length ? ' Errors: ' + data.errors.map((e: { network: string; error: string }) => `${e.network}: ${e.error}`).join('; ') : ''}`);
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-maroon-900">Integrations</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Connect email (SMTP) and social network tokens. Secrets are stored securely and never shown on the public site.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {status === 'saved' ? <span className="text-sm font-medium text-emerald-600">Saved</span> : null}
          {status === 'error' ? <span className="text-sm font-medium text-rose-600">Could not save (sign in again)</span> : null}
          <Button onClick={save} disabled={status === 'saving' || status === 'loading'}>
            {status === 'saving' ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>

      {note ? <p className="mb-5 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink-soft">{note}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Email (SMTP)" desc="Used to send admission confirmations, decision updates, contact replies and password resets.">
          <Field label="Host" id="smtp-host" value={cfg.smtp?.host ?? ''} placeholder="smtp.gmail.com" onChange={(e) => patch((d) => { d.smtp!.host = e.target.value; })} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Port" id="smtp-port" type="number" value={cfg.smtp?.port ?? 587} onChange={(e) => patch((d) => { d.smtp!.port = Number(e.target.value); })} />
            <label className="flex items-center gap-2 pt-7 text-sm text-ink-soft">
              <input type="checkbox" checked={!!cfg.smtp?.secure} onChange={(e) => patch((d) => { d.smtp!.secure = e.target.checked; })} />
              Use TLS/SSL (port 465)
            </label>
          </div>
          <Field label="Username" id="smtp-user" value={cfg.smtp?.user ?? ''} placeholder="no-reply@yourschool.com" onChange={(e) => patch((d) => { d.smtp!.user = e.target.value; })} />
          <Field label="Password / app password" id="smtp-pass" type="password" value={cfg.smtp?.pass ?? ''} placeholder="leave blank to keep current" onChange={(e) => patch((d) => { d.smtp!.pass = e.target.value; })} />
          <Field label="From address" id="smtp-from" value={cfg.smtp?.from ?? ''} placeholder="City Parents School <no-reply@yourschool.com>" onChange={(e) => patch((d) => { d.smtp!.from = e.target.value; })} />
          <Button variant="outline" onClick={testEmail} disabled={status === 'loading'}>Send test email</Button>
        </Card>

        <Card title="Social auto-sync" desc="Pull the latest posts onto the public social wall automatically (every 6 hours) once tokens are set.">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" checked={!!cfg.social?.autoSync} onChange={(e) => patch((d) => { d.social!.autoSync = e.target.checked; })} />
            Enable automatic syncing
          </label>

          <div className="rounded-xl border border-line p-4">
            <p className="mb-3 text-sm font-semibold text-maroon-800">YouTube</p>
            <Field label="API key" id="yt-key" type="password" value={cfg.social?.youtube?.apiKey ?? ''} placeholder="leave blank to keep current" onChange={(e) => patch((d) => { d.social!.youtube = { ...d.social!.youtube, apiKey: e.target.value }; })} />
            <div className="mt-3" />
            <Field label="Channel ID" id="yt-ch" value={cfg.social?.youtube?.channelId ?? ''} placeholder="UCxxxxxxxx" onChange={(e) => patch((d) => { d.social!.youtube = { ...d.social!.youtube, channelId: e.target.value }; })} />
          </div>

          <div className="rounded-xl border border-line p-4">
            <p className="mb-3 text-sm font-semibold text-maroon-800">Instagram</p>
            <Field label="Graph access token" id="ig-tok" type="password" value={cfg.social?.instagram?.accessToken ?? ''} placeholder="leave blank to keep current" onChange={(e) => patch((d) => { d.social!.instagram = { ...d.social!.instagram, accessToken: e.target.value }; })} />
          </div>

          <Button variant="outline" onClick={syncNow}>Sync now</Button>
          <p className="text-xs text-ink-muted">Posts pulled in are published to the wall automatically. You can still hide or delete any post under Social Wall.</p>
        </Card>
      </div>
    </>
  );
}
