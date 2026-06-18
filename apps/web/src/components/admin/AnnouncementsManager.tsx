'use client';

import { useEffect, useState } from 'react';
import { Field, SelectField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/admin/AdminUI';
import { Icon } from '@/components/Icon';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001';

type Announcement = {
  id: string;
  message: string;
  severity: string;
  link?: string | null;
  isActive: boolean;
  createdAt: string;
};

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

export function AnnouncementsManager() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ message: '', severity: 'INFO', link: '' });

  async function load() {
    const res = await fetch(`${API}/api/announcements/all`, { headers: authHeaders() }).catch(() => null);
    if (res && res.ok) setItems(await res.json());
    else setMsg('Sign in to manage announcements.');
  }
  useEffect(() => {
    load();
  }, []);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`${API}/api/announcements`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ message: form.message, severity: form.severity, link: form.link || undefined, isActive: true }),
    }).catch(() => null);
    if (res && res.ok) {
      setForm({ message: '', severity: 'INFO', link: '' });
      setMsg('Announcement published.');
      load();
    } else setMsg('Publish failed (sign in again).');
  }

  async function toggle(a: Announcement) {
    const res = await fetch(`${API}/api/announcements/${a.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ isActive: !a.isActive }),
    }).catch(() => null);
    if (res && res.ok) load();
    else setMsg('Update failed (sign in again).');
  }

  async function remove(id: string) {
    const res = await fetch(`${API}/api/announcements/${id}`, { method: 'DELETE', headers: authHeaders() }).catch(() => null);
    if (res && res.ok) setItems((p) => p.filter((x) => x.id !== id));
    else setMsg('Delete failed (sign in again).');
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-maroon-900">Announcements</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Publish notices that appear in the banner across the public website.
          </p>
        </div>
        {msg ? <span className="text-sm font-medium text-maroon-700">{msg}</span> : null}
      </div>

      <form onSubmit={publish} className="mb-8 grid gap-4 rounded-2xl border border-line bg-white p-6 md:grid-cols-[2fr_1fr]">
        <Field label="Message" id="m" value={form.message} required placeholder="e.g. Term 2 begins on 5 May 2026" onChange={(e) => setForm({ ...form, message: e.target.value })} />
        <SelectField label="Severity" id="sev" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="CRITICAL">Critical</option>
        </SelectField>
        <Field label="Link (optional)" id="lnk" value={form.link} placeholder="/admissions" onChange={(e) => setForm({ ...form, link: e.target.value })} />
        <div className="flex items-end">
          <Button type="submit" icon="megaphone">Publish announcement</Button>
        </div>
      </form>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-ink-muted">No announcements yet.</p>
        ) : (
          items.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-maroon-50 px-2 py-0.5 text-xs font-semibold text-maroon-700">{a.severity}</span>
                  <StatusBadge status={a.isActive ? 'published' : 'draft'} />
                </div>
                <p className="mt-1 text-ink">{a.message}</p>
              </div>
              <div className="flex gap-2">
                <Button size="md" variant={a.isActive ? 'outline' : 'primary'} onClick={() => toggle(a)}>
                  {a.isActive ? 'Unpublish' : 'Publish'}
                </Button>
                <button onClick={() => remove(a.id)} aria-label="Delete" className="rounded-xl p-2.5 text-ink-muted hover:bg-rose-50 hover:text-rose-600">
                  <Icon name="trash" size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
