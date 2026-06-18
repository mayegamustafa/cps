import { PageHeader, DataTable, RowActions } from '@/components/admin/AdminUI';
import { Button } from '@/components/ui/Button';
import { events } from '@/lib/content';

export default function AdminEventsPage() {
  return (
    <>
      <PageHeader
        title="Events"
        subtitle="Manage the events calendar, registrations and reminders."
        action={<Button href="#" icon="plus">New event</Button>}
      />
      <DataTable
        columns={['Event', 'Category', 'Date', 'Time', 'Location', '']}
        rows={events.map((e) => [
          <span key="t" className="font-medium">{e.title}</span>,
          e.category,
          e.date,
          e.time,
          e.location,
          <RowActions key="a" />,
        ])}
      />
    </>
  );
}
