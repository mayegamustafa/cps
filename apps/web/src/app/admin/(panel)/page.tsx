import Link from 'next/link';
import { PageHeader, StatCard, DataTable, StatusBadge } from '@/components/admin/AdminUI';
import { Button } from '@/components/ui/Button';
import { dashboardStats, recentAdmissions, adminNews } from '@/lib/admin';

export default function AdminDashboard() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back. Here’s what’s happening across the platform."
        action={<Button href="/admin/news" icon="plus">New article</Button>}
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-maroon-900">Recent admissions</h2>
            <Link href="/admin/admissions" className="text-sm font-semibold text-maroon-700">View all</Link>
          </div>
          <DataTable
            columns={['Reference', 'Pupil', 'Section', 'Status']}
            rows={recentAdmissions.map((a) => [
              <span key="r" className="font-mono text-xs">{a.ref}</span>,
              a.pupil,
              a.section,
              <StatusBadge key="s" status={a.status} />,
            ])}
          />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-maroon-900">Latest content</h2>
            <Link href="/admin/news" className="text-sm font-semibold text-maroon-700">Manage</Link>
          </div>
          <DataTable
            columns={['Title', 'Status', 'Views']}
            rows={adminNews.slice(0, 4).map((n) => [
              <span key="t" className="line-clamp-1">{n.title}</span>,
              <StatusBadge key="s" status={n.status} />,
              n.views.toLocaleString(),
            ])}
          />
        </section>
      </div>
    </>
  );
}
