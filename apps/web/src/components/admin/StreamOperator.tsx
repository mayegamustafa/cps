'use client';

import { useEffect, useState } from 'react';
import { Field, SelectField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/admin/AdminUI';
import { Icon } from '@/components/Icon';

const API = ''; // same-origin; proxied to the backend

type Stream = {
  id: string;
  slug: string;
  title: string;
  status: string;
  provider: string;
  embedUrl?: string | null;
  ingestKey?: string | null;
  recordingUrl?: string | null;
  scheduledAt?: string | null;
};

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

export function StreamOperator() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ title: '', provider: 'RTMP', scheduledAt: '', embedUrl: '' });

  async function load() {
    const res = await fetch(`${API}/api/live/manage/list`, { headers: authHeaders() }).catch(() => null);
    if (res && res.ok) setStreams(await res.json());
    else setMsg('Sign in as an operator to manage streams.');
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`${API}/api/live`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: form.title,
        provider: form.provider,
        embedUrl: form.embedUrl || undefined,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
      }),
    }).catch(() => null);
    if (res && res.ok) {
      setForm({ title: '', provider: 'RTMP', scheduledAt: '', embedUrl: '' });
      setMsg('Stream created.');
      load();
    } else setMsg('Create failed (sign in again).');
  }

  async function act(id: string, action: 'start' | 'end') {
    const res = await fetch(`${API}/api/live/${id}/${action}`, { method: 'POST', headers: authHeaders() }).catch(() => null);
    if (res && res.ok) load();
    else setMsg('Action failed (sign in again).');
  }

  async function addRecording(id: string) {
    const url = window.prompt('Recording URL (e.g. R2 / YouTube link):');
    if (!url) return;
    const res = await fetch(`${API}/api/live/${id}/recording`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ recordingUrl: url }),
    }).catch(() => null);
    if (res && res.ok) load();
    else setMsg('Save failed (sign in again).');
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-maroon-900">Live Streaming</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Create events, schedule broadcasts, go live, end streams and archive recordings.
          </p>
        </div>
        {msg ? <span className="text-sm font-medium text-maroon-700">{msg}</span> : null}
      </div>

      {/* Create */}
      <form onSubmit={create} className="mb-8 grid gap-4 rounded-2xl border border-line bg-white p-6 md:grid-cols-2">
        <Field label="Title" id="t" value={form.title} required onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <SelectField label="Provider" id="p" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
          <option value="RTMP">RTMP (self-hosted)</option>
          <option value="YOUTUBE">YouTube Live</option>
          <option value="FACEBOOK">Facebook Live</option>
          <option value="ZOOM">Zoom Webinar</option>
        </SelectField>
        <Field label="Scheduled for" id="s" type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
        <Field label="Embed / watch URL (external providers)" id="e" value={form.embedUrl} placeholder="https://youtube.com/embed/..." onChange={(e) => setForm({ ...form, embedUrl: e.target.value })} />
        <div className="md:col-span-2">
          <Button type="submit" icon="plus">Create stream</Button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-3">
        {streams.length === 0 ? (
          <p className="text-ink-muted">No streams yet.</p>
        ) : (
          streams.map((s) => (
            <div key={s.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-ink">{s.title}</h3>
                    <StatusBadge status={s.status} />
                    <span className="rounded-full bg-maroon-50 px-2 py-0.5 text-xs font-semibold text-maroon-700">{s.provider}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    /live/{s.slug}
                    {s.scheduledAt ? ` · scheduled ${new Date(s.scheduledAt).toLocaleString()}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.status !== 'LIVE' && s.status !== 'ARCHIVED' ? (
                    <Button size="md" onClick={() => act(s.id, 'start')} icon="play">Start</Button>
                  ) : null}
                  {s.status === 'LIVE' ? (
                    <Button size="md" variant="outline" onClick={() => act(s.id, 'end')}>Stop</Button>
                  ) : null}
                  <Button size="md" variant="ghost" onClick={() => addRecording(s.id)} icon="video">Recording</Button>
                </div>
              </div>
              {s.provider === 'RTMP' && s.ingestKey ? (
                <p className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
                  <Icon name="shield-check" size={14} className="text-maroon-600" />
                  Ingest key: <code className="rounded bg-paper-dark px-2 py-0.5">{s.ingestKey.slice(0, 8)}••••</code>
                </p>
              ) : null}
              {s.recordingUrl ? (
                <p className="mt-2 text-xs text-emerald-600">Recording archived</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </>
  );
}
