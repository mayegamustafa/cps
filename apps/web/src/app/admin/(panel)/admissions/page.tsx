'use client';

import { ResourceManager, type ResourceConfig } from '@/components/admin/ResourceManager';

const config: ResourceConfig = {
  title: 'Admissions',
  description: 'Review pupil applications and update their status.',
  listUrl: '/api/admissions',
  createUrl: '/api/admissions',
  itemUrl: (row) => `/api/admissions/${row.id}/decision`,
  updateMethod: 'PATCH',
  readOnlyCreate: true,
  fields: [
    { key: 'reference', label: 'Reference', table: true, readonly: true },
    { key: 'pupilFirstName', label: 'Pupil first name', table: true, readonly: true },
    { key: 'pupilLastName', label: 'Pupil last name', table: true, readonly: true },
    { key: 'section', label: 'Section', table: true, readonly: true },
    { key: 'guardianName', label: 'Guardian', readonly: true },
    { key: 'guardianEmail', label: 'Guardian email', readonly: true },
    { key: 'status', label: 'Status', type: 'select', table: true, required: true, options: [
      { value: 'SUBMITTED', label: 'Submitted' },
      { value: 'UNDER_REVIEW', label: 'Under review' },
      { value: 'SHORTLISTED', label: 'Shortlisted' },
      { value: 'INTERVIEW_SCHEDULED', label: 'Interview scheduled' },
      { value: 'OFFER_MADE', label: 'Offer made' },
      { value: 'ACCEPTED', label: 'Accepted' },
      { value: 'REJECTED', label: 'Rejected' },
      { value: 'WITHDRAWN', label: 'Withdrawn' },
    ] },
    { key: 'extraData', label: 'Extra answers', table: true, readonly: true },
    { key: 'decisionNote', label: 'Decision note', type: 'textarea' },
  ],
};

export default function AdminAdmissionsPage() {
  return <ResourceManager config={config} />;
}
