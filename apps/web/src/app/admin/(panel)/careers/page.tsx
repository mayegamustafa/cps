'use client';

import { ResourceManager, type ResourceConfig } from '@/components/admin/ResourceManager';

const config: ResourceConfig = {
  title: 'Careers',
  description: 'Manage job vacancies. Open vacancies appear on the public Careers page.',
  listUrl: '/api/careers/vacancies/admin/list',
  createUrl: '/api/careers/vacancies',
  itemUrl: (row) => `/api/careers/vacancies/${row.id}`,
  fields: [
    { key: 'title', label: 'Job title', required: true, table: true },
    { key: 'department', label: 'Department', required: true, table: true },
    { key: 'type', label: 'Type', type: 'select', table: true, options: [
      { value: 'FULL_TIME', label: 'Full-time' },
      { value: 'PART_TIME', label: 'Part-time' },
      { value: 'CONTRACT', label: 'Contract' },
      { value: 'TEMPORARY', label: 'Temporary' },
      { value: 'VOLUNTEER', label: 'Volunteer' },
    ] },
    { key: 'status', label: 'Status', type: 'select', table: true, options: [
      { value: 'OPEN', label: 'Open' },
      { value: 'CLOSED', label: 'Closed' },
      { value: 'DRAFT', label: 'Draft' },
    ] },
    { key: 'location', label: 'Location', placeholder: 'Kampala, Uganda' },
    { key: 'deadline', label: 'Application deadline', type: 'date', table: true },
    { key: 'salaryRange', label: 'Salary range' },
    { key: 'requirements', label: 'Requirements (comma separated)', type: 'tags' },
    { key: 'responsibilities', label: 'Responsibilities (comma separated)', type: 'tags' },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    { key: 'applicationFields', label: 'Extra application questions (shown on the apply form)', type: 'formBuilder' },
  ],
};

export default function AdminCareersPage() {
  return <ResourceManager config={config} />;
}
