'use client';

import { useEffect, useState } from 'react';
import { Field, SelectField } from '@/components/ui/Field';
import { FileUpload } from '@/components/admin/FileUpload';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/admin/AdminUI';
import { Icon } from '@/components/Icon';

const API = '';

type Announcement = {
  id: string;
  message: string;
  severity: string;
  link?: string | null;
  linkLabel?: string | null;
  imageUrl?: string | null;
  popup: boolean;
  isActive: boolean;
  createdAt: string;
};

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

const blank = { message: '', severity: 'INFO', link: '', linkLabel: '', imageUrl: '', popup: false };

export function AnnouncementsManager() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState(blank);

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
      body: JSON.stringify({
        message: form.message,
        severity: form.severity,
        link: form.link || undefined,
        linkLabel: form.linkLabel || undefined,
        imageUrl: form.imageUrl || undefined,
        popup: form.popup,
        isActive: true,
      }),
    }).catch(() => null);
    if (res && res.ok) {
      setForm(blank);
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
            Publish notices shown in the site banner and (optionally) as a pop-up.
          </p>
        </div>
        {msg ? <span className="text-sm font-medium text-maroon-700">{msg}</span> : null}
      </div>

      <form onSubmit={publish} className="mb-8 grid gap-4 rounded-2xl border border-line bg-white p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="Message" id="m" value={form.message} required placeholder="e.g. Term 2 begins on 5 May 2026" onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
        <SelectField label="Severity" id="sev" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="CRITICAL">Critical</option>
        </SelectField>
        <Field label="Link (optional)" id="lnk" value={form.link} placeholder="/admissions or https://…" onChange={(e) => setForm({ ...form, link: e.target.value })} />
        <Field label="Link label" id="ll" value={form.linkLabel} placeholder="Learn more" onChange={(e) => setForm({ ...form, linkLabel: e.target.value })} />
        <FileUpload label="Image (optional)" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
        <label className="flex items-center gap-2 text-sm font-medium text-ink md:col-span-2">
          <input type="checkbox" checked={form.popup} onChange={(e) => setForm({ ...form, popup: e.target.checked })} className="h-4 w-4 rounded border-line" />
          Show as a pop-up on the homepage (auto-dismisses after a few seconds)
        </label>
        <div className="md:col-span-2">
          <Button type="submit" icon="megaphone">Publish announcement</Button>
        </div>
      </form>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-ink-muted">No announcements yet.</p>
        ) : (
          items.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">
              <div className="flex min-w-0 items-center gap-3">
                {a.imageUrl ? (
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cover bg-center" style={{ backgroundImage: `url('${a.imageUrl}')` }} />
                ) : null}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-maroon-50 px-2 py-0.5 text-xs font-semibold text-maroon-700">{a.severity}</span>
                    <StatusBadge status={a.isActive ? 'published' : 'draft'} />
                    {a.popup ? <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-semibold text-maroon-800">Pop-up</span> : null}
                  </div>
                  <p className="mt-1 text-ink">{a.message}</p>
                </div>
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
