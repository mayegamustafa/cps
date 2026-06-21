'use client';

import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';

type Application = {
  id: string;
  vacancyId: string;
  vacancy?: { title?: string } | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cvUrl: string;
  coverLetterUrl?: string | null;
  extraData?: Record<string, unknown> | null;
  status: string;
  score?: number | null;
  notes?: string | null;
  createdAt: string;
};

const STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFER_MADE', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'];

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

function extraToString(extra: Record<string, unknown> | null | undefined): string {
  if (!extra || typeof extra !== 'object') return '';
  return Object.entries(extra).map(([k, v]) => `${k}: ${v}`).join('; ');
}

export function JobApplicationsInbox() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [role, setRole] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/careers/applications', { headers: authHeaders() }).catch(() => null);
    if (res && res.ok) setItems(await res.json());
    else setMsg('Sign in as HR to view applications.');
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const roles = useMemo(() => Array.from(new Set(items.map((a) => a.vacancy?.title).filter(Boolean))) as string[], [items]);
  const filtered = role ? items.filter((a) => a.vacancy?.title === role) : items;

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/careers/applications/${id}/review`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }) }).catch(() => null);
    if (res && res.ok) setItems((p) => p.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  function exportCsv() {
    const cols = ['First name', 'Last name', 'Email', 'Phone', 'Role', 'CV', 'Cover letter', 'Status', 'Extra answers', 'Submitted'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [cols.join(',')];
    for (const a of filtered) {
      lines.push([a.firstName, a.lastName, a.email, a.phone, a.vacancy?.title ?? '', a.cvUrl, a.coverLetterUrl ?? '', a.status, extraToString(a.extraData), new Date(a.createdAt).toLocaleString()].map(esc).join(','));
    }
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = `job-applications-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(link.href);
  }

  function printList() {
    const e = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const head = ['Applicant', 'Role', 'Email', 'Phone', 'Status', 'Extra answers', 'Submitted'].map((c) => `<th>${c}</th>`).join('');
    const body = filtered.map((a) => `<tr><td>${e(a.firstName)} ${e(a.lastName)}</td><td>${e(a.vacancy?.title)}</td><td>${e(a.email)}</td><td>${e(a.phone)}</td><td>${e(a.status)}</td><td>${e(extraToString(a.extraData))}</td><td>${e(new Date(a.createdAt).toLocaleString())}</td></tr>`).join('');
    const html = `<!doctype html><html><head><title>Job applications</title><style>body{font-family:Arial;padding:24px;}h1{color:#6e1f23;font-size:20px;}table{width:100%;border-collapse:collapse;font-size:12px;}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;}th{background:#f5eceb;color:#6e1f23;}</style></head><body><h1>City Parents School — Job applications</h1><p>${filtered.length} application(s)</p><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table><script>window.onload=function(){window.print();}</script></body></html>`;
    const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); }
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-maroon-900">Job applications</h1>
          <p className="mt-1 text-sm text-ink-soft">Applications submitted through the public Careers pages. {msg}</p>
        </div>
        <div className="flex items-center gap-2">
          {roles.length ? (
            <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-full border border-line px-3.5 py-2 text-sm text-ink-soft focus:outline-none">
              <option value="">All roles</option>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          ) : null}
          <button onClick={exportCsv} disabled={filtered.length === 0} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-ink-soft hover:bg-maroon-50 hover:text-maroon-700 disabled:opacity-40"><Icon name="download" size={16} /> Excel (CSV)</button>
          <button onClick={printList} disabled={filtered.length === 0} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-ink-soft hover:bg-maroon-50 hover:text-maroon-700 disabled:opacity-40"><Icon name="download" size={16} /> PDF / Print</button>
        </div>
      </div>

      {loading ? (
        <p className="text-ink-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-ink-muted">No applications yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div key={a.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ink">{a.firstName} {a.lastName}</h3>
                    {a.vacancy?.title ? <span className="rounded-full bg-maroon-50 px-2 py-0.5 text-xs font-semibold text-maroon-700">{a.vacancy.title}</span> : null}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    <a href={`mailto:${a.email}`} className="hover:text-maroon-700">{a.email}</a> · {a.phone} · {new Date(a.createdAt).toLocaleString()}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    <a href={a.cvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-maroon-700 hover:underline"><Icon name="download" size={14} /> CV</a>
                    {a.coverLetterUrl ? <a href={a.coverLetterUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-maroon-700 hover:underline"><Icon name="download" size={14} /> Cover letter</a> : null}
                  </div>
                  {a.extraData && Object.keys(a.extraData).length ? (
                    <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                      {Object.entries(a.extraData).map(([k, v]) => (
                        <div key={k} className="text-sm">
                          <dt className="inline font-medium text-ink-soft">{k}: </dt>
                          <dd className="inline text-ink">{String(v)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </div>
                <div className="shrink-0">
                  <label className="mb-1 block text-xs font-medium text-ink-muted">Status</label>
                  <select value={a.status} onChange={(e) => setStatus(a.id, e.target.value)} className="rounded-xl border border-line px-3 py-2 text-sm focus:border-maroon-500 focus:outline-none">
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').toLowerCase()}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
