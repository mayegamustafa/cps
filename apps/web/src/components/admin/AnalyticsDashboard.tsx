'use client';

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';

type Slice = { label: string; count: number };
type Summary = {
  range: { days: number };
  totals: {
    views: number; visitors: number; sessions: number;
    newVisitors: number; returningVisitors: number;
    avgSessionMinutes: number; bounceRate: number;
  };
  series: { date: string; views: number; visitors: number }[];
  topPages: Slice[]; devices: Slice[]; browsers: Slice[]; os: Slice[]; sources: Slice[]; countries: Slice[];
};

const RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-3xl text-maroon-900">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-ink-muted">{sub}</p> : null}
    </div>
  );
}

function BarList({ title, data }: { title: string; data: Slice[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h3 className="mb-4 font-display text-lg text-maroon-900">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-ink-muted">No data yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {data.slice(0, 8).map((d) => (
            <li key={d.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="truncate pr-3 text-ink">{d.label || '—'}</span>
                <span className="shrink-0 font-medium text-ink-soft">{d.count}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-paper-dark">
                <div className="h-full rounded-full bg-maroon-600" style={{ width: `${(d.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TrendChart({ series }: { series: { date: string; views: number; visitors: number }[] }) {
  const max = Math.max(1, ...series.map((s) => s.views));
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg text-maroon-900">Daily traffic</h3>
        <div className="flex items-center gap-4 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-maroon-600" /> Views</span>
        </div>
      </div>
      <div className="flex h-40 items-end gap-[3px]">
        {series.map((s) => (
          <div key={s.date} className="group relative flex-1" title={`${s.date}: ${s.views} views, ${s.visitors} visitors`}>
            <div className="w-full rounded-t bg-maroon-600/85 transition-all hover:bg-maroon-700" style={{ height: `${Math.max(2, (s.views / max) * 150)}px` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-ink-muted">
        <span>{series[0]?.date.slice(5)}</span>
        <span>{series[series.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

export function AnalyticsDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setMsg('');
    const res = await fetch(`/api/analytics/summary?days=${days}`, { headers: authHeaders() }).catch(() => null);
    if (res && res.ok) setData(await res.json());
    else setMsg('Sign in as an admin to view analytics.');
    setLoading(false);
  }, [days]);
  useEffect(() => { load(); }, [load]);

  function exportCsv() {
    if (!data) return;
    const lines: string[] = [];
    const section = (title: string, rows: Slice[]) => {
      lines.push(title); lines.push('Label,Count');
      rows.forEach((r) => lines.push(`"${r.label.replace(/"/g, '""')}",${r.count}`));
      lines.push('');
    };
    lines.push(`City Parents School — Analytics (last ${data.range.days} days)`, '');
    lines.push('Metric,Value');
    Object.entries(data.totals).forEach(([k, v]) => lines.push(`${k},${v}`));
    lines.push('');
    section('Top pages', data.topPages);
    section('Traffic sources', data.sources);
    section('Devices', data.devices);
    section('Browsers', data.browsers);
    section('Operating systems', data.os);
    section('Countries', data.countries);
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-maroon-900">Visitor analytics</h1>
          <p className="mt-1 text-sm text-ink-soft">First-party, privacy-conscious traffic insights. {msg}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-line">
            {RANGES.map((r) => (
              <button key={r.days} onClick={() => setDays(r.days)} className={`px-3.5 py-2 text-sm font-medium ${days === r.days ? 'bg-maroon-700 text-white' : 'text-ink-soft hover:bg-maroon-50'}`}>{r.label}</button>
            ))}
          </div>
          <button onClick={exportCsv} disabled={!data} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-ink-soft hover:bg-maroon-50 hover:text-maroon-700 disabled:opacity-40"><Icon name="download" size={16} /> Export CSV</button>
        </div>
      </div>

      {loading ? (
        <p className="text-ink-muted">Loading…</p>
      ) : !data ? (
        <p className="text-ink-muted">No analytics available.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Page views" value={data.totals.views.toLocaleString()} />
            <Kpi label="Unique visitors" value={data.totals.visitors.toLocaleString()} sub={`${data.totals.newVisitors} new · ${data.totals.returningVisitors} returning`} />
            <Kpi label="Sessions" value={data.totals.sessions.toLocaleString()} sub={`Avg ${data.totals.avgSessionMinutes} min`} />
            <Kpi label="Bounce rate" value={`${data.totals.bounceRate}%`} sub="Single-page sessions" />
          </div>

          <TrendChart series={data.series} />

          <div className="grid gap-6 lg:grid-cols-2">
            <BarList title="Top pages" data={data.topPages} />
            <BarList title="Traffic sources" data={data.sources} />
            <BarList title="Devices" data={data.devices} />
            <BarList title="Browsers" data={data.browsers} />
            <BarList title="Operating systems" data={data.os} />
            <BarList title="Countries" data={data.countries} />
          </div>
        </div>
      )}
    </>
  );
}
