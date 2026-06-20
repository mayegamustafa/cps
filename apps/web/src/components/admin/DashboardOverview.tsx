'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatCard, DataTable, StatusBadge } from '@/components/admin/AdminUI';

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function getJson(url: string): Promise<unknown[]> {
  try {
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

type Row = Record<string, unknown>;

export function DashboardOverview() {
  const [news, setNews] = useState<Row[]>([]);
  const [events, setEvents] = useState<Row[]>([]);
  const [admissions, setAdmissions] = useState<Row[]>([]);
  const [vacancies, setVacancies] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [n, e, a, v] = await Promise.all([
        getJson('/api/news/admin/list'),
        getJson('/api/events/admin/list'),
        getJson('/api/admissions'),
        getJson('/api/careers/vacancies/admin/list'),
      ]);
      setNews(n as Row[]);
      setEvents(e as Row[]);
      setAdmissions(a as Row[]);
      setVacancies(v as Row[]);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-2xl text-maroon-900">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {loading ? 'Loading live data…' : 'Live figures from the database.'}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Admissions" value={String(admissions.length)} icon="inbox" />
        <StatCard label="News articles" value={String(news.length)} icon="megaphone" />
        <StatCard label="Events" value={String(events.length)} icon="calendar" />
        <StatCard label="Open vacancies" value={String(vacancies.length)} icon="briefcase" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-maroon-900">Recent admissions</h2>
            <Link href="/admin/admissions" className="text-sm font-semibold text-maroon-700">View all</Link>
          </div>
          <DataTable
            columns={['Reference', 'Pupil', 'Status']}
            rows={admissions.slice(0, 5).map((a) => [
              <span key="r" className="font-mono text-xs">{String(a.reference ?? '—')}</span>,
              `${a.pupilFirstName ?? ''} ${a.pupilLastName ?? ''}`.trim() || '—',
              <StatusBadge key="s" status={String(a.status ?? 'submitted')} />,
            ])}
          />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-maroon-900">Latest news</h2>
            <Link href="/admin/news" className="text-sm font-semibold text-maroon-700">Manage</Link>
          </div>
          <DataTable
            columns={['Title', 'Status']}
            rows={news.slice(0, 5).map((n) => [
              <span key="t" className="line-clamp-1">{String(n.title ?? '—')}</span>,
              <StatusBadge key="s" status={String(n.status ?? 'draft')} />,
            ])}
          />
        </section>
      </div>
    </>
  );
}
