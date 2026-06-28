'use client';

import { useEffect, useState } from 'react';
import { Field, SelectField, TextAreaField } from '@/components/ui/Field';
import { FileUpload } from '@/components/admin/FileUpload';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/admin/AdminUI';
import { Icon } from '@/components/Icon';

const API = '';

type Announcement = {
  id: string;
  title?: string | null;
  message: string;
  severity: string;
  category?: string | null;
  link?: string | null;
  linkLabel?: string | null;
  imageUrl?: string | null;
  eventDate?: string | null;
  priority?: number;
  popup: boolean;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  audience?: string | null;
  pages?: string[];
  device?: string | null;
  frequency?: string | null;
  createdAt: string;
};

const iso = (v: string) => (v ? new Date(v).toISOString() : undefined);

// ISO → value for <input type="datetime-local"> in the admin's local time.
function toLocalInput(v?: string | null): string {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

// Refresh the public banner/popup cache so changes appear immediately.
function revalidatePublic() {
  fetch(`${API}/api/revalidate`, { method: 'POST' }).catch(() => {});
}

const blank = {
  title: '', message: '', severity: 'INFO', category: 'general',
  link: '', linkLabel: '', imageUrl: '', eventDate: '', priority: 0,
  popup: false, startsAt: '', endsAt: '',
  audience: 'all', pages: '', device: 'all', frequency: 'session',
};

export function AnnouncementsManager() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`${API}/api/announcements/all`, { headers: authHeaders() }).catch(() => null);
    if (res && res.ok) setItems(await res.json());
    else setMsg('Sign in to manage announcements.');
  }
  useEffect(() => {
    load();
  }, []);

  function resetForm() { setForm(blank); setEditingId(null); }

  function startEdit(a: Announcement) {
    setEditingId(a.id);
    setForm({
      title: a.title ?? '', message: a.message, severity: a.severity, category: a.category ?? 'general',
      link: a.link ?? '', linkLabel: a.linkLabel ?? '', imageUrl: a.imageUrl ?? '',
      eventDate: toLocalInput(a.eventDate), priority: a.priority ?? 0,
      popup: a.popup, startsAt: toLocalInput(a.startsAt), endsAt: toLocalInput(a.endsAt),
      audience: a.audience ?? 'all', pages: (a.pages ?? []).join(', '),
      device: a.device ?? 'all', frequency: a.frequency ?? 'session',
    });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      title: form.title || undefined,
      message: form.message,
      severity: form.severity,
      category: form.category,
      link: form.link || undefined,
      linkLabel: form.linkLabel || undefined,
      imageUrl: form.imageUrl || undefined,
      eventDate: iso(form.eventDate),
      priority: Number(form.priority) || 0,
      popup: form.popup,
      startsAt: iso(form.startsAt),
      endsAt: iso(form.endsAt),
      audience: form.audience,
      pages: form.pages.split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
      device: form.device,
      frequency: form.frequency,
    };
    if (!editingId) payload.isActive = true;
    const url = editingId ? `${API}/api/announcements/${editingId}` : `${API}/api/announcements`;
    const res = await fetch(url, {
      method: editingId ? 'PATCH' : 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).catch(() => null);
    if (res && res.ok) {
      resetForm();
      setMsg(editingId ? 'Announcement updated.' : 'Announcement published.');
      revalidatePublic();
      load();
    } else setMsg('Save failed (sign in again).');
  }

  async function toggle(a: Announcement) {
    const res = await fetch(`${API}/api/announcements/${a.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ isActive: !a.isActive }),
    }).catch(() => null);
    if (res && res.ok) { revalidatePublic(); load(); }
    else setMsg('Update failed (sign in again).');
  }

  async function remove(id: string) {
    if (!confirm('Delete this announcement?')) return;
    const res = await fetch(`${API}/api/announcements/${id}`, { method: 'DELETE', headers: authHeaders() }).catch(() => null);
    if (res && res.ok) { setItems((p) => p.filter((x) => x.id !== id)); revalidatePublic(); if (editingId === id) resetForm(); }
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

      <form onSubmit={submit} className="mb-8 grid gap-4 rounded-2xl border border-line bg-white p-6 md:grid-cols-2">
        <Field label="Title (optional)" id="t" value={form.title} placeholder="e.g. Term 2 Begins" onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <SelectField label="Type" id="cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="general">General information</option>
          <option value="event">Event</option>
          <option value="admission">Admission notice</option>
          <option value="holiday">Holiday notice</option>
          <option value="emergency">Emergency notice</option>
          <option value="maintenance">Maintenance notice</option>
        </SelectField>
        <div className="md:col-span-2">
          <TextAreaField label="Message" id="m" value={form.message} required placeholder="e.g. Term 2 begins on 5 May 2026" onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
        <SelectField label="Severity" id="sev" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="CRITICAL">Critical</option>
        </SelectField>
        <Field label="Priority (higher shows first)" id="pri" type="number" value={String(form.priority)} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
        <Field label="Link (optional)" id="lnk" value={form.link} placeholder="/admissions or https://…" onChange={(e) => setForm({ ...form, link: e.target.value })} />
        <Field label="Button label" id="ll" value={form.linkLabel} placeholder="Learn more" onChange={(e) => setForm({ ...form, linkLabel: e.target.value })} />
        <Field label="Event date (optional)" id="ed" type="datetime-local" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
        <FileUpload label="Image / banner (optional)" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />

        <div className="grid grid-cols-2 gap-4 md:col-span-2">
          <Field label="Start showing (optional)" id="sa" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          <Field label="Stop showing (optional)" id="ea" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-line p-3 text-sm font-medium text-ink md:col-span-2">
          <input type="checkbox" checked={form.popup} onChange={(e) => setForm({ ...form, popup: e.target.checked })} className="h-4 w-4 rounded border-line" />
          Show as a centered pop-up (otherwise only in the slim banner)
        </label>

        {form.popup ? (
          <>
            <SelectField label="Show on" id="aud" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              <option value="all">Entire website</option>
              <option value="homepage">Homepage only</option>
              <option value="specific">Specific pages</option>
            </SelectField>
            <SelectField label="Devices" id="dev" value={form.device} onChange={(e) => setForm({ ...form, device: e.target.value })}>
              <option value="all">All devices</option>
              <option value="mobile">Mobile only</option>
              <option value="desktop">Desktop only</option>
            </SelectField>
            {form.audience === 'specific' ? (
              <div className="md:col-span-2">
                <Field label="Page paths (comma separated)" id="pgs" value={form.pages} placeholder="/admissions, /news" onChange={(e) => setForm({ ...form, pages: e.target.value })} />
              </div>
            ) : null}
            <SelectField label="Frequency" id="freq" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
              <option value="session">Once per visit (session)</option>
              <option value="always">Every page load</option>
            </SelectField>
          </>
        ) : null}

        <div className="flex items-center gap-3 md:col-span-2">
          <Button type="submit" icon="megaphone">{editingId ? 'Update announcement' : 'Publish announcement'}</Button>
          {editingId ? (
            <Button type="button" variant="ghost" onClick={resetForm}>Cancel edit</Button>
          ) : null}
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
                    {a.category && a.category !== 'general' ? <span className="rounded-full bg-maroon-50 px-2 py-0.5 text-xs font-semibold capitalize text-maroon-700">{a.category}</span> : null}
                    <span className="rounded-full bg-paper-dark px-2 py-0.5 text-xs font-semibold text-ink-soft">{a.severity}</span>
                    <StatusBadge status={a.isActive ? 'published' : 'draft'} />
                    {a.popup ? <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-semibold text-maroon-800">Pop-up</span> : null}
                  </div>
                  {a.title ? <p className="mt-1 font-semibold text-ink">{a.title}</p> : null}
                  <p className={a.title ? 'text-sm text-ink-soft' : 'mt-1 text-ink'}>{a.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="md" variant={a.isActive ? 'outline' : 'primary'} onClick={() => toggle(a)}>
                  {a.isActive ? 'Unpublish' : 'Publish'}
                </Button>
                <button onClick={() => startEdit(a)} aria-label="Edit" className="rounded-xl p-2.5 text-ink-muted hover:bg-maroon-50 hover:text-maroon-700">
                  <Icon name="edit" size={18} />
                </button>
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
