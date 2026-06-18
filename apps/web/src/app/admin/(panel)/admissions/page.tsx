import { PageHeader, DataTable, StatusBadge, RowActions } from '@/components/admin/AdminUI';
import { Button } from '@/components/ui/Button';
import { recentAdmissions } from '@/lib/admin';

export default function AdminAdmissionsPage() {
  return (
    <>
      <PageHeader
        title="Admissions"
        subtitle="Review applications, request documents and issue admission letters."
        action={<Button href="#" variant="outline" icon="download">Export</Button>}
      />
      <DataTable
        columns={['Reference', 'Pupil', 'Section', 'Submitted', 'Status', '']}
        rows={recentAdmissions.map((a) => [
          <span key="r" className="font-mono text-xs">{a.ref}</span>,
          <span key="p" className="font-medium">{a.pupil}</span>,
          a.section,
          a.date,
          <StatusBadge key="s" status={a.status} />,
          <RowActions key="x" />,
        ])}
      />
    </>
  );
}
