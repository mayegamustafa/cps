import { PageHeader, DataTable, RowActions } from '@/components/admin/AdminUI';
import { Button } from '@/components/ui/Button';
import { alumni } from '@/lib/content';

export default function AdminAlumniPage() {
  return (
    <>
      <PageHeader
        title="Alumni"
        subtitle="Manage the alumni directory, stories, events and donations."
        action={<Button href="#" icon="plus">Add alumnus</Button>}
      />
      <DataTable
        columns={['Name', 'Graduation year', 'Current role', 'Organisation', '']}
        rows={alumni.map((a) => [
          <span key="n" className="font-medium">{a.name}</span>,
          String(a.year),
          a.role,
          a.org,
          <RowActions key="x" />,
        ])}
      />
    </>
  );
}
