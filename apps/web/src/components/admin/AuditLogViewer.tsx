'use client';

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';

type Entry = {
  id: string;
  createdAt: string;
  actorEmail?: string | null;
  action: string;
  status: string;
  entityType?: string | null;
  entityId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

export function AuditLogViewer() {
  const [items, setItems] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [action, setAction] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setMsg('');
    const qs = new URLSearchParams();
    if (action) qs.set('action', action);
    if (status) qs.set('status', status);
    const res = await fetch(`/api/audit?${qs.toString()}`, { headers: authHeaders() }).catch(() => null);
    if (res && res.ok) setItems(await res.json());
    else setMsg('Sign in as a super admin to view the audit trail.');
    setLoading(false);
  }, [action, status]);
  useEffect(() => { load(); }, [load]);

  function exportCsv() {
    const cols = ['Time', 'Actor', 'Action', 'Status', 'Entity', 'IP'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [cols.join(',')];
    for (const e of items) {
      lines.push([new Date(e.createdAt).toLocaleString(), e.actorEmail ?? '', e.action, e.status, [e.entityType, e.entityId].filter(Boolean).join('/'), e.ip ?? ''].map(esc).join(','));
    }
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-maroon-900">Audit trail</h1>
          <p className="mt-1 text-sm text-ink-soft">Admin actions, logins and security events. {msg}</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Filter action…" className="rounded-full border border-line px-3.5 py-2 text-sm focus:border-maroon-500 focus:outline-none" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-full border border-line px-3.5 py-2 text-sm text-ink-soft focus:outline-none">
            <option value="">All</option>
            <option value="ok">Success</option>
            <option value="error">Failed</option>
          </select>
          <button onClick={exportCsv} disabled={items.length === 0} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-ink-soft hover:bg-maroon-50 hover:text-maroon-700 disabled:opacity-40"><Icon name="download" size={16} /> CSV</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper-dark/50">
              <tr>
                <th className="px-5 py-3.5 font-semibold text-ink-soft">Time</th>
                <th className="px-5 py-3.5 font-semibold text-ink-soft">Actor</th>
                <th className="px-5 py-3.5 font-semibold text-ink-soft">Action</th>
                <th className="px-5 py-3.5 font-semibold text-ink-soft">Status</th>
                <th className="px-5 py-3.5 font-semibold text-ink-soft">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-ink-muted">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-ink-muted">No activity recorded yet.</td></tr>
              ) : items.map((e) => (
                <tr key={e.id} className="hover:bg-paper-dark/30">
                  <td className="whitespace-nowrap px-5 py-3 text-ink-muted">{new Date(e.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-3 text-ink">{e.actorEmail || '—'}</td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-soft">{e.action}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${e.status === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{e.status}</span>
                  </td>
                  <td className="px-5 py-3 text-ink-muted">{e.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
