'use client';

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';
import { FileUpload } from '@/components/admin/FileUpload';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  roles: string[];
  isActive: boolean;
  lastLoginAt?: string | null;
  mailboxAccess?: { mailboxId: string }[];
};

/** Staff roles only. The parent and pupil roles belong to the family portals. */
const STAFF_ROLES: { value: string; label: string; note: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', note: 'Everything, including staff and addresses' },
  { value: 'MARKETING_ADMIN', label: 'Marketing Admin', note: 'News, events, media, social' },
  { value: 'ADMISSIONS_ADMIN', label: 'Admissions Admin', note: 'Applications and admissions' },
  { value: 'HR_ADMIN', label: 'HR Admin', note: 'Careers and job applications' },
  { value: 'FINANCE_ADMIN', label: 'Finance Admin', note: 'Fees and donations' },
  { value: 'CONTENT_EDITOR', label: 'Content Editor', note: 'Pages and articles' },
];

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

const inputCls =
  'w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink focus:border-maroon-500 focus:outline-none';

type Draft = Partial<User> & { password?: string };

export function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<Draft | null>(null);
  const [pwFor, setPwFor] = useState<User | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/users', { headers: authHeaders() }).catch(() => null);
    if (res && res.ok) setUsers(await res.json());
    else setNotice('Only a super admin can manage staff accounts.');
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(u: User) {
    if (!confirm(`Remove ${u.firstName} ${u.lastName}? They lose access immediately.`)) return;
    const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE', headers: authHeaders() }).catch(() => null);
    if (res && res.ok) void load();
    else {
      const data = res ? await res.json().catch(() => null) : null;
      alert(data?.message ?? 'Could not remove this account.');
    }
  }

  async function toggleActive(u: User) {
    const res = await fetch(`/api/users/${u.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ isActive: !u.isActive }),
    }).catch(() => null);
    if (res && res.ok) void load();
    else {
      const data = res ? await res.json().catch(() => null) : null;
      alert(data?.message ?? 'Could not change this account.');
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-maroon-900">Staff and access</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Accounts that can sign in to this admin. {notice}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ roles: [], isActive: true })}
          className="inline-flex items-center gap-1.5 rounded-full bg-maroon-700 px-4 py-2 text-sm font-medium text-white hover:bg-maroon-800"
        >
          <Icon name="plus" size={16} /> New staff account
        </button>
      </div>

      <p className="mb-4 rounded-2xl border border-line bg-paper/60 p-4 text-sm text-ink-soft">
        An account with no role ticked can only use the Mailbox, and only the addresses assigned to
        it under Mailbox, Addresses. That is the right setup for someone who just answers email.
      </p>

      {loading ? (
        <p className="text-ink-muted">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-ink-muted">No staff accounts yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {users.map((u) => (
            <div key={u.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {u.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-maroon-700 text-sm font-semibold text-white">
                      {(u.firstName[0] ?? '') + (u.lastName[0] ?? '')}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="truncate text-xs text-ink-muted">{u.email}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => setEditing(u)} aria-label="Edit" title="Edit" className="rounded-lg p-2 text-ink-muted hover:bg-maroon-50 hover:text-maroon-700">
                    <Icon name="edit" size={17} />
                  </button>
                  <button onClick={() => setPwFor(u)} aria-label="Set password" title="Set password" className="rounded-lg p-2 text-ink-muted hover:bg-maroon-50 hover:text-maroon-700">
                    <Icon name="shield-check" size={17} />
                  </button>
                  <button onClick={() => remove(u)} aria-label="Remove" title="Remove" className="rounded-lg p-2 text-ink-muted hover:bg-rose-50 hover:text-rose-600">
                    <Icon name="trash" size={17} />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {u.roles.length === 0 ? (
                  <span className="rounded-full bg-paper-dark px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
                    Mailbox only
                  </span>
                ) : (
                  u.roles.map((r) => (
                    <span key={r} className="rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-semibold text-maroon-800">
                      {STAFF_ROLES.find((s) => s.value === r)?.label ?? r}
                    </span>
                  ))
                )}
                {u.mailboxAccess?.length ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {u.mailboxAccess.length} address{u.mailboxAccess.length > 1 ? 'es' : ''}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => toggleActive(u)}
                  className={[
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    u.isActive ? 'bg-paper-dark text-ink-soft hover:bg-paper-dark/70' : 'bg-rose-50 text-rose-600',
                  ].join(' ')}
                >
                  {u.isActive ? 'Active' : 'Suspended'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing ? (
        <UserDialog
          draft={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      ) : null}

      {pwFor ? <PasswordDialog user={pwFor} onClose={() => setPwFor(null)} /> : null}
    </>
  );
}

function UserDialog({ draft, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Draft>(draft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isNew = !form.id;

  function toggleRole(role: string) {
    const roles = new Set(form.roles ?? []);
    if (roles.has(role)) roles.delete(role);
    else roles.add(role);
    setForm({ ...form, roles: [...roles] });
  }

  async function save() {
    setSaving(true);
    setError('');
    const body = isNew
      ? {
          email: form.email?.trim(),
          firstName: form.firstName?.trim(),
          lastName: form.lastName?.trim(),
          phone: form.phone?.trim() || undefined,
          password: form.password,
          roles: form.roles ?? [],
        }
      : {
          firstName: form.firstName?.trim(),
          lastName: form.lastName?.trim(),
          phone: form.phone?.trim() || undefined,
          avatarUrl: form.avatarUrl || undefined,
          roles: form.roles ?? [],
          isActive: form.isActive !== false,
        };
    const res = await fetch(isNew ? '/api/users' : `/api/users/${form.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(body),
    }).catch(() => null);
    setSaving(false);
    if (res && res.ok) onSaved();
    else {
      const data = res ? await res.json().catch(() => null) : null;
      setError(
        Array.isArray(data?.message) ? data.message.join('. ') : data?.message ?? 'Could not save.',
      );
    }
  }

  const ready =
    form.firstName?.trim() &&
    form.lastName?.trim() &&
    (!isNew || (form.email?.trim() && (form.password ?? '').length >= 8));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-display text-lg text-maroon-900">{isNew ? 'New staff account' : 'Edit staff account'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-ink-muted hover:bg-paper-dark/50">
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="space-y-3 p-5">
          {isNew ? (
            <>
              <L label="Email" hint="They sign in with this">
                <input value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
              </L>
              <L label="Temporary password" hint="At least 8 characters. They can change it under My Profile.">
                <input value={form.password ?? ''} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} />
              </L>
            </>
          ) : (
            <>
              <p className="text-sm text-ink-soft">{form.email}</p>
              <L label="Profile picture">
                <FileUpload
                  label=""
                  value={form.avatarUrl ?? ''}
                  onChange={(url) => setForm({ ...form, avatarUrl: url })}
                  accept="image/*"
                />
              </L>
            </>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <L label="First name">
              <input value={form.firstName ?? ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputCls} />
            </L>
            <L label="Last name">
              <input value={form.lastName ?? ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputCls} />
            </L>
          </div>
          <L label="Phone">
            <input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          </L>

          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-soft">Roles</p>
            <div className="space-y-1.5">
              {STAFF_ROLES.map((r) => (
                <label key={r.value} className="flex items-start gap-2.5 rounded-xl border border-line p-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={(form.roles ?? []).includes(r.value)}
                    onChange={() => toggleRole(r.value)}
                    className="mt-0.5 h-4 w-4 rounded border-line text-maroon-700 focus:ring-maroon-500"
                  />
                  <span>
                    <span className="font-medium text-ink">{r.label}</span>
                    <span className="block text-xs text-ink-muted">{r.note}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              Leave all of these unticked for someone who should only answer email. Give them
              addresses under Mailbox, Addresses.
            </p>
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-ink-muted hover:text-ink">Cancel</button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !ready}
            className="rounded-full bg-maroon-700 px-5 py-2 text-sm font-medium text-white hover:bg-maroon-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isNew ? 'Create account' : 'Save changes'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function PasswordDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  async function save() {
    setBusy(true);
    const res = await fetch(`/api/users/${user.id}/password`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ password }),
    }).catch(() => null);
    setBusy(false);
    setNote(res && res.ok ? 'Password set. They are signed out everywhere and must sign in again.' : 'Could not set it.');
    if (res && res.ok) setPassword('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-display text-lg text-maroon-900">Set password</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-ink-muted hover:bg-paper-dark/50">
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="space-y-3 p-5">
          <p className="text-sm text-ink-soft">
            For {user.firstName} {user.lastName} ({user.email}).
          </p>
          <L label="New password" hint="At least 8 characters">
            <input value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
          </L>
          {note ? <p className="text-sm text-ink-soft">{note}</p> : null}
        </div>
        <footer className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-ink-muted hover:text-ink">Close</button>
          <button
            type="button"
            onClick={save}
            disabled={busy || password.length < 8}
            className="rounded-full bg-maroon-700 px-5 py-2 text-sm font-medium text-white hover:bg-maroon-800 disabled:opacity-50"
          >
            {busy ? 'Setting…' : 'Set password'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function L({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      {label ? <label className="mb-1 block text-xs font-medium text-ink-soft">{label}</label> : null}
      {children}
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}
