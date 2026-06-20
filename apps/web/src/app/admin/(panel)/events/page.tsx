'use client';

import { ResourceManager, type ResourceConfig } from '@/components/admin/ResourceManager';

const config: ResourceConfig = {
  title: 'Events',
  description: 'Manage the events calendar. Published events show on the News & Events page.',
  listUrl: '/api/events/admin/list',
  createUrl: '/api/events',
  itemUrl: (row) => `/api/events/${row.id}`,
  fields: [
    { key: 'title', label: 'Title', required: true, table: true },
    { key: 'category', label: 'Category', table: true, placeholder: 'Sports, Academics…' },
    { key: 'startsAt', label: 'Starts', type: 'datetime', required: true, table: true },
    { key: 'endsAt', label: 'Ends', type: 'datetime' },
    { key: 'location', label: 'Location', table: true },
    { key: 'status', label: 'Status', type: 'select', table: true, options: [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'PUBLISHED', label: 'Published' },
      { value: 'ARCHIVED', label: 'Archived' },
    ] },
    { key: 'coverImage', label: 'Cover image URL', type: 'image' },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
  ],
};

export default function AdminEventsPage() {
  return <ResourceManager config={config} />;
}
