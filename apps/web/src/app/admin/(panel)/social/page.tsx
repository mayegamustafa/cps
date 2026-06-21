'use client';

import { ResourceManager, type ResourceConfig } from '@/components/admin/ResourceManager';

const config: ResourceConfig = {
  title: 'Social Wall',
  description: 'Curate posts shown on the public social wall. (Automatic syncing needs network API tokens.)',
  listUrl: '/api/social/admin/list',
  createUrl: '/api/social',
  itemUrl: (row) => `/api/social/${row.id}`,
  updateMethod: 'PATCH',
  fields: [
    { key: 'network', label: 'Network', type: 'select', table: true, required: true, options: [
      { value: 'YOUTUBE', label: 'YouTube' },
      { value: 'INSTAGRAM', label: 'Instagram' },
      { value: 'TIKTOK', label: 'TikTok' },
      { value: 'FACEBOOK', label: 'Facebook' },
      { value: 'LINKEDIN', label: 'LinkedIn' },
      { value: 'X', label: 'X (Twitter)' },
    ] },
    { key: 'caption', label: 'Caption', type: 'textarea', required: true, table: true },
    { key: 'permalink', label: 'Link to post', placeholder: 'https://…' },
    { key: 'thumbnailUrl', label: 'Image', type: 'image' },
    { key: 'isVideo', label: 'Is a video', type: 'boolean', table: true },
  ],
};

export default function AdminSocialPage() {
  return <ResourceManager config={config} />;
}
