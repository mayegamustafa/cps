'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { FieldDesigner, withKeys, type FormField } from '@/components/admin/FieldDesigner';

type FormItem = {
  id: string;
  slug?: string;
  title: string;
  description?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  fields: FormField[];
  submitLabel?: string | null;
  successMessage?: string | null;
  submissions?: number;
};
type Submission = { id: string; data: Record<string, unknown>; createdAt: string };

const inputCls =
  'w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink shadow-sm placeholder:text-ink-muted focus:border-maroon-500 focus:outline-none focus:ring-2 focus:ring-maroon-500/20';

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

function blankForm(): FormItem {
  return { id: '', title: '', description: '', status: 'DRAFT', fields: [], submitLabel: 'Submit', successMessage: 'Thank you — your response has been received.' };
}

export function FormsManager() {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [view, setView] = useState<'list' | 'builder' | 'submissions'>('list');
  const [draft, setDraft] = useState<FormItem>(blankForm());
  const [busy, setBusy] = useState(false);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [subForm, setSubForm] = useState<FormItem | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/forms/admin/list', { headers: authHeaders() }).catch(() => null);
    if (res && res.ok) setForms(await res.json());
    else setMsg('Sign in to manage forms.');
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function newForm() { setDraft(blankForm()); setView('builder'); setMsg(''); }
  function edit(f: FormItem) { setDraft({ ...f, fields: Array.isArray(f.fields) ? f.fields : [] }); setView('builder'); setMsg(''); }

  function patchDraft(p: Partial<FormItem>) { setDraft((d) => ({ ...d, ...p })); }

  async function saveForm() {
    setBusy(true); setMsg('');
    // Ensure every field has a stable key derived from its label.
    const fields = withKeys(draft.fields);
    const payload = {
      title: draft.title,
      description: draft.description ?? '',
      fields,
      status: draft.status,
      submitLabel: draft.submitLabel ?? 'Submit',
      successMessage: draft.successMessage ?? '',
    };
    const url = draft.id ? `/api/forms/${draft.id}` : '/api/forms';
    const method = draft.id ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) }).catch(() => null);
    setBusy(false);
    if (res && res.ok) { setView('list'); await load(); setMsg('Saved.'); }
    else { const b = res ? await res.json().catch(() => ({})) : {}; setMsg((b as { message?: string }).message ?? 'Save failed (sign in again).'); }
  }

  async function remove(f: FormItem) {
    if (!confirm(`Delete "${f.title}" and all its submissions?`)) return;
    const res = await fetch(`/api/forms/${f.id}`, { method: 'DELETE', headers: authHeaders() }).catch(() => null);
    if (res && res.ok) setForms((p) => p.filter((x) => x.id !== f.id));
  }

  async function openSubmissions(f: FormItem) {
    setSubForm(f); setView('submissions'); setSubs([]);
    const res = await fetch(`/api/forms/${f.id}/submissions`, { headers: authHeaders() }).catch(() => null);
    if (res && res.ok) setSubs(await res.json());
  }

  // ── List view ──
  if (view === 'list') {
    return (
      <>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-maroon-900">Forms</h1>
            <p className="mt-1 text-sm text-ink-soft">Design custom forms with their own public page. Responses collect in an inbox you can export.</p>
          </div>
          <div className="flex items-center gap-3">
            {msg ? <span className="text-sm font-medium text-maroon-700">{msg}</span> : null}
            <Button onClick={newForm} icon="plus">New form</Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper-dark/50">
              <tr>
                <th className="px-5 py-3.5 font-semibold text-ink-soft">Title</th>
                <th className="px-5 py-3.5 font-semibold text-ink-soft">Status</th>
                <th className="px-5 py-3.5 font-semibold text-ink-soft">Public link</th>
                <th className="px-5 py-3.5 font-semibold text-ink-soft">Responses</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-ink-muted">Loading…</td></tr>
              ) : forms.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-ink-muted">No forms yet.</td></tr>
              ) : forms.map((f) => (
                <tr key={f.id} className="hover:bg-paper-dark/30">
                  <td className="px-5 py-3.5 font-medium text-ink">{f.title}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${f.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-paper-dark text-ink-muted'}`}>{f.status}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {f.status === 'PUBLISHED' && f.slug ? (
                      <a href={`/forms/${f.slug}`} target="_blank" rel="noreferrer" className="text-maroon-700 hover:underline">/forms/{f.slug}</a>
                    ) : <span className="text-ink-muted">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => openSubmissions(f)} className="font-medium text-maroon-700 hover:underline">{f.submissions ?? 0}</button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 text-ink-muted">
                      <button onClick={() => edit(f)} aria-label="Edit" className="rounded-lg p-1.5 hover:bg-maroon-50 hover:text-maroon-700"><Icon name="edit" size={17} /></button>
                      <button onClick={() => remove(f)} aria-label="Delete" className="rounded-lg p-1.5 hover:bg-rose-50 hover:text-rose-600"><Icon name="trash" size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  // ── Submissions inbox ──
  if (view === 'submissions' && subForm) {
    const cols = (subForm.fields ?? []).map((f) => ({ key: f.key, label: f.label }));
    function exportCsv() {
      const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const header = [...cols.map((c) => c.label), 'Submitted'];
      const lines = [header.map(esc).join(',')];
      for (const s of subs) lines.push([...cols.map((c) => esc(s.data[c.key])), esc(new Date(s.createdAt).toLocaleString())].join(','));
      const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `${(subForm?.slug || 'form')}-responses.csv`; a.click(); URL.revokeObjectURL(a.href);
    }
    function printSubs() {
      const e = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
      const head = [...cols.map((c) => `<th>${e(c.label)}</th>`), '<th>Submitted</th>'].join('');
      const body = subs.map((s) => `<tr>${[...cols.map((c) => `<td>${e(s.data[c.key])}</td>`), `<td>${e(new Date(s.createdAt).toLocaleString())}</td>`].join('')}</tr>`).join('');
      const html = `<!doctype html><html><head><title>${e(subForm!.title)}</title><style>body{font-family:Arial;padding:24px;}h1{color:#6e1f23;font-size:20px;}table{width:100%;border-collapse:collapse;font-size:12px;}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;}th{background:#f5eceb;color:#6e1f23;}</style></head><body><h1>${e(subForm!.title)} — responses</h1><p>${subs.length} response(s)</p><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table><script>window.onload=function(){window.print();}</script></body></html>`;
      const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); }
    }
    return (
      <>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button onClick={() => setView('list')} className="mb-2 inline-flex items-center gap-1 text-sm text-maroon-700 hover:underline"><Icon name="arrow-right" size={15} className="rotate-180" /> All forms</button>
            <h1 className="font-display text-2xl text-maroon-900">{subForm.title} — responses</h1>
            <p className="mt-1 text-sm text-ink-soft">{subs.length} response(s).</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCsv} disabled={subs.length === 0} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-ink-soft hover:bg-maroon-50 hover:text-maroon-700 disabled:opacity-40"><Icon name="download" size={16} /> Excel (CSV)</button>
            <button onClick={printSubs} disabled={subs.length === 0} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-ink-soft hover:bg-maroon-50 hover:text-maroon-700 disabled:opacity-40"><Icon name="download" size={16} /> PDF / Print</button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper-dark/50">
              <tr>
                {cols.map((c) => <th key={c.key} className="px-5 py-3.5 font-semibold text-ink-soft">{c.label}</th>)}
                <th className="px-5 py-3.5 font-semibold text-ink-soft">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {subs.length === 0 ? (
                <tr><td colSpan={cols.length + 1} className="px-5 py-8 text-center text-ink-muted">No responses yet.</td></tr>
              ) : subs.map((s) => (
                <tr key={s.id} className="hover:bg-paper-dark/30">
                  {cols.map((c) => <td key={c.key} className="px-5 py-3.5 text-ink">{String(s.data[c.key] ?? '—')}</td>)}
                  <td className="px-5 py-3.5 text-ink-muted">{new Date(s.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  // ── Builder ──
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <button onClick={() => setView('list')} className="mb-2 inline-flex items-center gap-1 text-sm text-maroon-700 hover:underline"><Icon name="arrow-right" size={15} className="rotate-180" /> All forms</button>
          <h1 className="font-display text-2xl text-maroon-900">{draft.id ? 'Edit form' : 'New form'}</h1>
        </div>
        <div className="flex items-center gap-3">
          {msg ? <span className="text-sm font-medium text-maroon-700">{msg}</span> : null}
          <Button onClick={saveForm} disabled={busy || !draft.title.trim()}>{busy ? 'Saving…' : 'Save form'}</Button>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-line bg-white p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Form title *</label>
            <input className={inputCls} value={draft.title} onChange={(e) => patchDraft({ title: e.target.value })} placeholder="e.g. Parent Feedback" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Description</label>
            <textarea rows={2} className={inputCls} value={draft.description ?? ''} onChange={(e) => patchDraft({ description: e.target.value })} placeholder="Shown under the title on the public page" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Status</label>
              <select className={inputCls} value={draft.status} onChange={(e) => patchDraft({ status: e.target.value as FormItem['status'] })}>
                <option value="DRAFT">Draft (hidden)</option>
                <option value="PUBLISHED">Published (live)</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Submit button label</label>
              <input className={inputCls} value={draft.submitLabel ?? ''} onChange={(e) => patchDraft({ submitLabel: e.target.value })} placeholder="Submit" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Public link</label>
              <p className="px-1 py-2.5 text-sm text-ink-muted">{draft.slug ? `/forms/${draft.slug}` : 'created on first save'}</p>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Success message</label>
            <input className={inputCls} value={draft.successMessage ?? ''} onChange={(e) => patchDraft({ successMessage: e.target.value })} placeholder="Shown after a successful submission" />
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6">
          <FieldDesigner fields={draft.fields} onChange={(fields) => patchDraft({ fields })} />
        </section>
      </div>
    </>
  );
}
