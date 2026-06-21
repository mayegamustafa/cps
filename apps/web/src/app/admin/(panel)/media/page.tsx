'use client';

import { ResourceManager, type ResourceConfig } from '@/components/admin/ResourceManager';

const config: ResourceConfig = {
  title: 'Gallery & Media',
  description: 'Photo albums shown on the public Gallery page. The album cover is taken from the first photo automatically.',
  listUrl: '/api/gallery/admin/list',
  createUrl: '/api/gallery',
  itemUrl: (row) => `/api/gallery/${row.id}`,
  fields: [
    { key: 'title', label: 'Album title', required: true, table: true },
    { key: 'category', label: 'Category', type: 'category', taxonomy: 'galleryCategories', table: true },
    { key: 'status', label: 'Status', type: 'select', table: true, options: [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'PUBLISHED', label: 'Published' },
      { value: 'ARCHIVED', label: 'Archived' },
    ] },
    { key: 'images', label: 'Photos', type: 'multiImage' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
};

export default function AdminMediaPage() {
  return <ResourceManager config={config} />;
}
