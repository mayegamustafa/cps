'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';

const API = ''; // same-origin; proxied to the backend

export type FieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'number'
  | 'date'
  | 'datetime'
  | 'tags'
  | 'image'
  | 'boolean';

export type Field = {
  key: string;
  label: string;
  type?: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  /** Show this field as a column in the list table. */
  table?: boolean;
  /** Display-only: shown in the table but not editable in the form. */
  readonly?: boolean;
};

export type ResourceConfig = {
  title: string;
  description: string;
  /** GET list (admin). */
  listUrl: string;
  /** POST create base. */
  createUrl: string;
  /** Builds the PUT/DELETE url for a row. */
  itemUrl: (row: Record<string, unknown>) => string;
  fields: Field[];
  /** PATCH instead of PUT for updates. */
  updateMethod?: 'PUT' | 'PATCH';
  /** Hide the Add button (e.g. review-only resources). */
  readOnlyCreate?: boolean;
};

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

function emptyForm(fields: Field[]) {
  const f: Record<string, string | boolean> = {};
  for (const field of fields) f[field.key] = field.type === 'boolean' ? false : '';
  return f;
}

// Convert a stored row value into a form input value.
function toInput(field: Field, value: unknown): string | boolean {
  if (value == null) return field.type === 'boolean' ? false : '';
  if (field.type === 'tags') return Array.isArray(value) ? value.join(', ') : String(value);
  if (field.type === 'boolean') return Boolean(value);
  if (field.type === 'datetime' && typeof value === 'string') return value.slice(0, 16);
  if (field.type === 'date' && typeof value === 'string') return value.slice(0, 10);
  return String(value);
}

// Convert form values into the API payload.
function toPayload(fields: Field[], form: Record<string, string | boolean>) {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.readonly) continue;
    const v = form[field.key];
    if (field.type === 'boolean') out[field.key] = Boolean(v);
    else if (v === '' || v == null) continue;
    else if (field.type === 'number') out[field.key] = Number(v);
    else if (field.type === 'tags')
      out[field.key] = String(v).split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    else if (field.type === 'datetime' || field.type === 'date')
      out[field.key] = new Date(String(v)).toISOString();
    else out[field.key] = v;
  }
  return out;
}

function displayCell(field: Field, value: unknown): string {
  if (value == null || value === '') return '—';
  if (field.type === 'boolean') return value ? 'Yes' : 'No';
  if (field.type === 'tags') return Array.isArray(value) ? value.join(', ') : String(value);
  if (field.type === 'date' || field.type === 'datetime')
    return new Date(String(value)).toLocaleDateString();
  const s = String(value);
  return s.length > 60 ? s.slice(0, 57) + '…' : s;
}

export function ResourceManager({ config }: { config: ResourceConfig }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>(emptyForm(config.fields));
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}${config.listUrl}`, { headers: authHeaders() });
      if (res.ok) setRows(await res.json());
      else setMsg('Sign in to manage this section.');
    } catch {
      setMsg('Cannot reach the API.');
    }
    setLoading(false);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.listUrl]);

  const tableFields = config.fields.filter((f) => f.table);

  function startCreate() {
    setEditing(null);
    setForm(emptyForm(config.fields));
    setOpen(true);
    setMsg('');
  }

  function startEdit(row: Record<string, unknown>) {
    setEditing(row);
    const f: Record<string, string | boolean> = {};
    for (const field of config.fields) f[field.key] = toInput(field, row[field.key]);
    setForm(f);
    setOpen(true);
    setMsg('');
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const payload = toPayload(config.fields, form);
    const url = editing ? `${API}${config.itemUrl(editing)}` : `${API}${config.createUrl}`;
    const method = editing ? config.updateMethod ?? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      if (res.ok) {
        setOpen(false);
        await load();
        setMsg(editing ? 'Saved.' : 'Created.');
      } else {
        const b = await res.json().catch(() => ({}));
        setMsg(typeof b.message === 'string' ? b.message : 'Save failed (sign in again).');
      }
    } catch {
      setMsg('Cannot reach the API.');
    }
    setBusy(false);
  }

  async function remove(row: Record<string, unknown>) {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API}${config.itemUrl(row)}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) setRows((p) => p.filter((r) => r !== row));
      else setMsg('Delete failed (sign in again).');
    } catch {
      setMsg('Cannot reach the API.');
    }
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-maroon-900">{config.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{config.description}</p>
        </div>
        <div className="flex items-center gap-3">
          {msg ? <span className="text-sm font-medium text-maroon-700">{msg}</span> : null}
          {config.readOnlyCreate ? null : (
            <Button onClick={startCreate} icon="plus">Add new</Button>
          )}
        </div>
      </div>

      {open ? (
        <form onSubmit={save} className="mb-8 rounded-2xl border border-line bg-white p-6">
          <h2 className="mb-4 font-display text-lg text-maroon-900">
            {editing ? 'Edit' : 'New'} {config.title.replace(/s$/, '')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {config.fields.filter((field) => !field.readonly).map((field) => (
              <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <FieldInput field={field} value={form[field.key]} onChange={(v) => setForm((f) => ({ ...f, [field.key]: v }))} />
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-3">
            <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper-dark/50">
              <tr>
                {tableFields.map((f) => (
                  <th key={f.key} className="px-5 py-3.5 font-semibold text-ink-soft">{f.label}</th>
                ))}
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={tableFields.length + 1} className="px-5 py-8 text-center text-ink-muted">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={tableFields.length + 1} className="px-5 py-8 text-center text-ink-muted">No items yet.</td></tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={i} className="hover:bg-paper-dark/30">
                    {tableFields.map((f) => (
                      <td key={f.key} className="px-5 py-3.5 text-ink">{displayCell(f, row[f.key])}</td>
                    ))}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 text-ink-muted">
                        <button onClick={() => startEdit(row)} aria-label="Edit" className="rounded-lg p-1.5 hover:bg-maroon-50 hover:text-maroon-700"><Icon name="edit" size={17} /></button>
                        <button onClick={() => remove(row)} aria-label="Delete" className="rounded-lg p-1.5 hover:bg-rose-50 hover:text-rose-600"><Icon name="trash" size={17} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const inputCls =
  'w-full rounded-xl border border-line bg-white px-4 py-2.5 text-ink shadow-sm transition-colors placeholder:text-ink-muted focus:border-maroon-500 focus:outline-none focus:ring-2 focus:ring-maroon-500/20';

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string | boolean;
  onChange: (v: string | boolean) => void;
}) {
  const label = (
    <label htmlFor={field.key} className="mb-1.5 block text-sm font-medium text-ink">
      {field.label} {field.required ? <span className="text-maroon-600">*</span> : null}
    </label>
  );

  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-2 pt-7 text-sm font-medium text-ink">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-line" />
        {field.label}
      </label>
    );
  }
  if (field.type === 'textarea') {
    return (<div>{label}<textarea id={field.key} rows={4} required={field.required} placeholder={field.placeholder} value={String(value)} onChange={(e) => onChange(e.target.value)} className={inputCls} /></div>);
  }
  if (field.type === 'select') {
    return (
      <div>{label}
        <select id={field.key} required={field.required} value={String(value)} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          <option value="">Select…</option>
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  }
  const inputType =
    field.type === 'number' ? 'number'
    : field.type === 'date' ? 'date'
    : field.type === 'datetime' ? 'datetime-local'
    : 'text';
  return (
    <div>{label}
      <input id={field.key} type={inputType} required={field.required} placeholder={field.placeholder ?? (field.type === 'image' ? 'https://… image URL' : field.type === 'tags' ? 'comma, separated' : '')} value={String(value)} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </div>
  );
}
