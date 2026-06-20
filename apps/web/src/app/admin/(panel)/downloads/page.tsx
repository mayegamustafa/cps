'use client';

import { ResourceManager, type ResourceConfig } from '@/components/admin/ResourceManager';

const config: ResourceConfig = {
  title: 'Downloads',
  description: 'Documents shown in the public Downloads Center.',
  listUrl: '/api/downloads/admin/list',
  createUrl: '/api/downloads',
  itemUrl: (row) => `/api/downloads/${row.id}`,
  fields: [
    { key: 'title', label: 'Title', required: true, table: true },
    { key: 'category', label: 'Category', required: true, table: true, placeholder: 'Prospectus, Forms, Policies…' },
    { key: 'fileUrl', label: 'File URL', required: true, placeholder: 'https://… link to the document' },
    { key: 'description', label: 'Description' },
    { key: 'isPublic', label: 'Visible on website', type: 'boolean', table: true },
  ],
};

export default function AdminDownloadsPage() {
  return <ResourceManager config={config} />;
}
