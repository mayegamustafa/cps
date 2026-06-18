import { PageHeader, DataTable, RowActions } from '@/components/admin/AdminUI';
import { Button } from '@/components/ui/Button';
import { downloads } from '@/lib/content';

export default function AdminDownloadsPage() {
  return (
    <>
      <PageHeader
        title="Downloads"
        subtitle="Manage prospectus, forms, policies and calendars available to the public."
        action={<Button href="#" icon="plus">Add document</Button>}
      />
      <DataTable
        columns={['Title', 'Category', 'Size', '']}
        rows={downloads.map((d) => [
          <span key="t" className="font-medium">{d.title}</span>,
          d.category,
          d.size,
          <RowActions key="a" />,
        ])}
      />
    </>
  );
}
