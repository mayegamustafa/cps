import { PageHeader, DataTable, StatusBadge, RowActions } from '@/components/admin/AdminUI';
import { Button } from '@/components/ui/Button';
import { adminApplications } from '@/lib/admin';
import { jobs } from '@/lib/content';

export default function AdminCareersPage() {
  return (
    <>
      <PageHeader
        title="Careers"
        subtitle="Manage vacancies, review applications and shortlist candidates."
        action={<Button href="#" icon="plus">New vacancy</Button>}
      />

      <h2 className="mb-3 font-display text-lg text-maroon-900">Open vacancies</h2>
      <DataTable
        columns={['Position', 'Department', 'Type', 'Deadline', '']}
        rows={jobs.map((j) => [
          <span key="t" className="font-medium">{j.title}</span>,
          j.department,
          j.type,
          j.deadline,
          <RowActions key="a" />,
        ])}
      />

      <h2 className="mb-3 mt-10 font-display text-lg text-maroon-900">Recent applications</h2>
      <DataTable
        columns={['Candidate', 'Applied for', 'Date', 'Status', '']}
        rows={adminApplications.map((a) => [
          <span key="n" className="font-medium">{a.name}</span>,
          a.role,
          a.date,
          <StatusBadge key="s" status={a.status} />,
          <RowActions key="x" />,
        ])}
      />
    </>
  );
}
