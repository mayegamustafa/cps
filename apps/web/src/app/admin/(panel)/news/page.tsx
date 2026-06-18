import { PageHeader, DataTable, StatusBadge, RowActions } from '@/components/admin/AdminUI';
import { Button } from '@/components/ui/Button';
import { adminNews } from '@/lib/admin';

export default function AdminNewsPage() {
  return (
    <>
      <PageHeader
        title="News & Articles"
        subtitle="Create, edit and publish news for the public website."
        action={<Button href="#" icon="plus">New article</Button>}
      />
      <DataTable
        columns={['Title', 'Status', 'Date', 'Views', '']}
        rows={adminNews.map((n) => [
          <span key="t" className="font-medium">{n.title}</span>,
          <StatusBadge key="s" status={n.status} />,
          n.date,
          n.views.toLocaleString(),
          <RowActions key="a" />,
        ])}
      />
    </>
  );
}
