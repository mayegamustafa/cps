'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';
import { FileUpload } from '@/components/admin/FileUpload';
import { useMe, updateMe, initialsOf, roleLabel, type Me } from '@/lib/session';

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

/** Your own account: picture, name, phone and password. */
export function ProfileForm() {
  const { me } = useMe();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', avatarUrl: '' });
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwNote, setPwNote] = useState('');

  useEffect(() => {
    if (!me) return;
    setForm({
      firstName: me.firstName ?? '',
      lastName: me.lastName ?? '',
      phone: me.phone ?? '',
      avatarUrl: me.avatarUrl ?? '',
    });
  }, [me]);

  async function save() {
    setSaving(true);
    setNote('');
    setError('');
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
        avatarUrl: form.avatarUrl || undefined,
      }),
    }).catch(() => null);
    setSaving(false);
    if (res && res.ok) {
      const saved = (await res.json()) as Me;
      updateMe({ ...(me as Me), ...saved });
      setNote('Saved.');
    } else {
      setError('Could not save. Check the details and try again.');
    }
  }

  async function changePassword() {
    setPwBusy(true);
    setPwNote('');
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    }).catch(() => null);
    setPwBusy(false);
    if (res && res.ok) {
      setCurrent('');
      setNext('');
      setPwNote('Password changed.');
    } else {
      setPwNote('Could not change it. Check your current password.');
    }
  }

  if (!me) return <p className="text-ink-muted">Loading…</p>;

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-2xl text-maroon-900">My profile</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {me.email} · {roleLabel(me.roles)}
        </p>
      </div>

      <section className="rounded-2xl border border-line bg-white p-5">
        <div className="mb-5 flex items-center gap-4">
          {form.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-maroon-700 text-xl font-semibold text-white">
              {initialsOf(me)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <FileUpload
              label="Profile picture"
              value={form.avatarUrl}
              onChange={(url) => setForm((f) => ({ ...f, avatarUrl: url }))}
              accept="image/*"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="First name">
            <input
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Last name">
            <input
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+256 ..."
              className={inputCls}
            />
          </Field>
        </div>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving || !form.firstName.trim() || !form.lastName.trim()}
            className="rounded-full bg-maroon-700 px-5 py-2 text-sm font-medium text-white hover:bg-maroon-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
          {note ? <span className="text-sm text-emerald-700">{note}</span> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg text-maroon-900">Change password</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Current password">
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
          </Field>
          <Field label="New password" hint="At least 8 characters">
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={changePassword}
            disabled={pwBusy || current.length < 1 || next.length < 8}
            className="inline-flex items-center gap-1.5 rounded-full border border-maroon-700 px-5 py-2 text-sm font-medium text-maroon-700 hover:bg-maroon-50 disabled:opacity-50"
          >
            <Icon name="shield-check" size={15} /> {pwBusy ? 'Changing…' : 'Change password'}
          </button>
          {pwNote ? <span className="text-sm text-ink-soft">{pwNote}</span> : null}
        </div>
      </section>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink focus:border-maroon-500 focus:outline-none';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-soft">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}
