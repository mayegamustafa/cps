'use client';

import { ResourceManager, type ResourceConfig } from '@/components/admin/ResourceManager';

const config: ResourceConfig = {
  title: 'Gallery & Media',
  description: 'Manage photo/video albums shown on the public Gallery page. Paste a cover image URL (file uploads route to Cloudflare R2 once connected).',
  listUrl: '/api/gallery/admin/list',
  createUrl: '/api/gallery',
  itemUrl: (row) => `/api/gallery/${row.id}`,
  fields: [
    { key: 'title', label: 'Album title', required: true, table: true },
    { key: 'category', label: 'Category', table: true, placeholder: 'Sports, Graduation, Trips…' },
    { key: 'status', label: 'Status', type: 'select', table: true, options: [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'PUBLISHED', label: 'Published' },
      { value: 'ARCHIVED', label: 'Archived' },
    ] },
    { key: 'coverImage', label: 'Cover image URL', type: 'image' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
};

export default function AdminMediaPage() {
  return <ResourceManager config={config} />;
}
