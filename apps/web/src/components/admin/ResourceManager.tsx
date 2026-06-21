'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { FileUpload } from '@/components/admin/FileUpload';
import { uploadFile } from '@/components/admin/FileUpload';
import { siteDefaults } from '@/lib/site';

const API = ''; // same-origin; proxied to the backend

export type FieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'category'
  | 'number'
  | 'date'
  | 'datetime'
  | 'tags'
  | 'image'
  | 'file'
  | 'multiImage'
  | 'boolean';

export type Field = {
  key: string;
  label: string;
  type?: FieldType;
  options?: { value: string; label: string }[];
  /** For type 'category': which editable taxonomy list to use for the dropdown. */
  taxonomy?: 'galleryCategories' | 'newsCategories' | 'eventCategories';
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
  if (field.type === 'multiImage') return Array.isArray(value) ? value.join('\n') : String(value);
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
    else if (field.type === 'multiImage')
      out[field.key] = String(v).split('\n').map((s) => s.trim()).filter(Boolean);
    else if (field.type === 'tags')
      out[field.key] = String(v).split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    else if (field.type === 'datetime' || field.type === 'date')
      out[field.key] = new Date(String(v)).toISOString();
    else out[field.key] = v;
  }
  return out;
}

// Flatten a stored value into a plain string for export.
function exportValue(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) return value.join('; ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// Build and download a CSV (opens in Excel/Sheets).
function downloadCsv(title: string, fields: Field[], rows: Record<string, unknown>[]) {
  const cols = fields.filter((f) => f.type !== 'image' && f.type !== 'multiImage' && f.type !== 'file');
  const header = cols.map((c) => c.label);
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = [header.map(escape).join(',')];
  for (const row of rows) {
    lines.push(cols.map((c) => escape(exportValue(row[c.key]))).join(','));
  }
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Open a print-friendly window (the user chooses "Save as PDF" in the dialog).
function printRows(title: string, fields: Field[], rows: Record<string, unknown>[]) {
  const cols = fields.filter((f) => f.type !== 'image' && f.type !== 'multiImage' && f.type !== 'file');
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const head = cols.map((c) => `<th>${esc(c.label)}</th>`).join('');
  const body = rows
    .map((r) => `<tr>${cols.map((c) => `<td>${esc(exportValue(r[c.key]))}</td>`).join('')}</tr>`)
    .join('');
  const html = `<!doctype html><html><head><title>${esc(title)}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;color:#222;padding:24px;}
      h1{color:#6e1f23;font-size:20px;margin:0 0 4px;}
      p{color:#666;font-size:12px;margin:0 0 16px;}
      table{width:100%;border-collapse:collapse;font-size:12px;}
      th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top;}
      th{background:#f5eceb;color:#6e1f23;}
    </style></head><body>
    <h1>City Parents School — ${esc(title)}</h1>
    <p>${rows.length} record(s) · Generated ${new Date().toLocaleString()}</p>
    <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
    <script>window.onload=function(){window.print();}</script>
    </body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
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
        <div className="flex items-center gap-2">
          {msg ? <span className="mr-1 text-sm font-medium text-maroon-700">{msg}</span> : null}
          <button
            type="button"
            onClick={() => downloadCsv(config.title, config.fields, rows)}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-ink-soft hover:bg-maroon-50 hover:text-maroon-700 disabled:opacity-40"
          >
            <Icon name="download" size={16} /> Excel (CSV)
          </button>
          <button
            type="button"
            onClick={() => printRows(config.title, config.fields, rows)}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-ink-soft hover:bg-maroon-50 hover:text-maroon-700 disabled:opacity-40"
          >
            <Icon name="download" size={16} /> PDF / Print
          </button>
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
  if (field.type === 'category') {
    return <CategorySelect field={field} value={String(value)} onChange={(v) => onChange(v)} labelEl={label} />;
  }
  if (field.type === 'image') {
    return <FileUpload label={field.label} value={String(value)} onChange={(url) => onChange(url)} />;
  }
  if (field.type === 'file') {
    return <FileUpload label={field.label} accept="*" value={String(value)} onChange={(url) => onChange(url)} />;
  }
  if (field.type === 'multiImage') {
    return <MultiImageInput label={field.label} value={String(value)} onChange={(v) => onChange(v)} />;
  }
  const inputType =
    field.type === 'number' ? 'number'
    : field.type === 'date' ? 'date'
    : field.type === 'datetime' ? 'datetime-local'
    : 'text';
  return (
    <div>{label}
      <input id={field.key} type={inputType} required={field.required} placeholder={field.placeholder ?? (field.type === 'tags' ? 'comma, separated' : '')} value={String(value)} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </div>
  );
}

// Dropdown of categories from the editable taxonomy in site settings.
// Admins can add a new category inline; it is persisted back to settings so it
// appears everywhere (and in the Settings → Categories tab) thereafter.
function CategorySelect({
  field,
  value,
  onChange,
  labelEl,
}: {
  field: Field;
  value: string;
  onChange: (v: string) => void;
  labelEl: React.ReactNode;
}) {
  const tax = field.taxonomy ?? 'galleryCategories';
  const [options, setOptions] = useState<string[]>(siteDefaults.taxonomies[tax]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          const list = data?.taxonomies?.[tax];
          if (Array.isArray(list) && list.length) setOptions(list);
        }
      } catch {
        /* keep defaults */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tax]);

  // Ensure the current value is selectable even if it isn't in the list yet.
  const allOptions = value && !options.includes(value) ? [value, ...options] : options;

  async function persist(next: string[]) {
    try {
      const cur: Record<string, unknown> = await fetch(`${API}/api/settings`).then((r) => (r.ok ? r.json() : {}));
      const taxonomies = { ...((cur.taxonomies as Record<string, unknown>) ?? {}), [tax]: next };
      await fetch(`${API}/api/settings`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ...cur, taxonomies }),
      });
    } catch {
      /* best-effort; the value is still applied to this item */
    }
  }

  function commitNew() {
    const v = draft.trim();
    if (!v) { setAdding(false); return; }
    const next = options.includes(v) ? options : [...options, v];
    setOptions(next);
    onChange(v);
    setAdding(false);
    setDraft('');
    void persist(next);
  }

  return (
    <div>{labelEl}
      {adding ? (
        <div className="flex gap-2">
          <input autoFocus value={draft} placeholder="New category name" onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitNew(); } }} className={inputCls} />
          <button type="button" onClick={commitNew} className="shrink-0 rounded-xl bg-maroon-700 px-4 text-sm font-medium text-white hover:bg-maroon-800">Add</button>
          <button type="button" onClick={() => setAdding(false)} className="shrink-0 rounded-xl px-3 text-sm text-ink-muted hover:text-ink">Cancel</button>
        </div>
      ) : (
        <select
          id={field.key}
          required={field.required}
          value={value}
          onChange={(e) => { if (e.target.value === '__add__') setAdding(true); else onChange(e.target.value); }}
          className={inputCls}
        >
          <option value="">Select…</option>
          {allOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          <option value="__add__">+ Add new category…</option>
        </select>
      )}
    </div>
  );
}

// Manages a newline-separated list of image URLs with upload + paste + remove.
function MultiImageInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const urls = value.split('\n').map((s) => s.trim()).filter(Boolean);
  const add = (url: string) => onChange([...urls, url].join('\n'));
  const removeAt = (i: number) => onChange(urls.filter((_, j) => j !== i).join('\n'));

  async function onPick(file: File) {
    setBusy(true);
    setError('');
    try {
      add(await uploadFile(file));
    } catch (e) {
      setError((e as Error).message + ' Paste a URL instead.');
    }
    setBusy(false);
  }

  return (
    <div className="sm:col-span-2">
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-maroon-700/30 px-3.5 py-2 text-sm font-medium text-maroon-800 hover:bg-maroon-50 disabled:opacity-50">
          <Icon name="image" size={16} /> {busy ? 'Uploading…' : 'Upload photo'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }} />
        <input type="url" value={paste} placeholder="…or paste an image URL" onChange={(e) => setPaste(e.target.value)} className="min-w-48 flex-1 rounded-xl border border-line bg-white px-4 py-2 text-sm focus:border-maroon-500 focus:outline-none" />
        <button type="button" onClick={() => { if (paste.trim()) { add(paste.trim()); setPaste(''); } }} className="rounded-full border border-line px-3 py-2 text-sm hover:bg-maroon-50">Add</button>
      </div>
      {error ? <p className="mt-1 text-xs text-maroon-600">{error}</p> : null}
      {urls.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {urls.map((u, i) => (
            <span key={i} className="group relative h-16 w-16 overflow-hidden rounded-lg border border-line bg-cover bg-center" style={{ backgroundImage: `url('${u}')` }}>
              <button type="button" onClick={() => removeAt(i)} aria-label="Remove" className="absolute right-0 top-0 bg-maroon-900/80 px-1.5 text-xs text-white opacity-0 group-hover:opacity-100">×</button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
