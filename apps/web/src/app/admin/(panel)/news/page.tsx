'use client';

import { ResourceManager, type ResourceConfig } from '@/components/admin/ResourceManager';

const config: ResourceConfig = {
  title: 'News & Articles',
  description: 'Create, edit and publish news. Published items appear on the public site.',
  listUrl: '/api/news/admin/list',
  createUrl: '/api/news',
  itemUrl: (row) => `/api/news/${row.id}`,
  fields: [
    { key: 'title', label: 'Title', required: true, table: true },
    { key: 'status', label: 'Status', type: 'select', table: true, options: [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'PUBLISHED', label: 'Published' },
      { value: 'SCHEDULED', label: 'Scheduled' },
      { value: 'ARCHIVED', label: 'Archived' },
    ] },
    { key: 'excerpt', label: 'Excerpt', placeholder: 'Short summary' },
    { key: 'coverImage', label: 'Cover image URL', type: 'image' },
    { key: 'tags', label: 'Tags', type: 'tags' },
    { key: 'body', label: 'Body', type: 'textarea', required: true },
  ],
};

export default function AdminNewsPage() {
  return <ResourceManager config={config} />;
}
