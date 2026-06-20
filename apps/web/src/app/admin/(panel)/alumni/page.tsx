'use client';

import { ResourceManager, type ResourceConfig } from '@/components/admin/ResourceManager';

const config: ResourceConfig = {
  title: 'Alumni',
  description: 'Manage the alumni directory shown on the public Alumni page.',
  listUrl: '/api/alumni/admin/list',
  createUrl: '/api/alumni',
  itemUrl: (row) => `/api/alumni/${row.id}`,
  fields: [
    { key: 'fullName', label: 'Full name', required: true, table: true },
    { key: 'graduationYear', label: 'Graduation year', type: 'number', required: true, table: true },
    { key: 'currentRole', label: 'Current role', table: true },
    { key: 'organisation', label: 'Organisation', table: true },
    { key: 'city', label: 'City' },
    { key: 'country', label: 'Country', placeholder: 'Uganda' },
    { key: 'photoUrl', label: 'Photo URL', type: 'image' },
    { key: 'bio', label: 'Bio / story', type: 'textarea' },
    { key: 'isPublic', label: 'Visible on website', type: 'boolean', table: true },
  ],
};

export default function AdminAlumniPage() {
  return <ResourceManager config={config} />;
}
