'use client';

import { ResourceManager, type ResourceConfig } from '@/components/admin/ResourceManager';

/**
 * Every field the admissions API returns is listed here, grouped the way the
 * application form asks for it. `table: true` picks the list columns; the rest
 * are still shown in full on the detail panel and the printed sheet, which is
 * where a reviewer needs the pupil's date of birth, the class applied for and
 * the guardian's phone number.
 *
 * Uploaded documents are intentionally absent: the list endpoint does not
 * `include` the AdmissionDocument relation, so they are not in the payload.
 */
const config: ResourceConfig = {
  title: 'Admissions',
  description: 'Review pupil applications, print the full record and update their status.',
  listUrl: '/api/admissions',
  createUrl: '/api/admissions',
  itemUrl: (row) => `/api/admissions/${row.id}/decision`,
  updateMethod: 'PATCH',
  readOnlyCreate: true,
  detail: {
    documentTitle: 'Admission Application',
    heading: (row) => `${row.pupilFirstName ?? ''} ${row.pupilLastName ?? ''}`.trim() || 'Applicant',
    subheading: (row) => String(row.reference ?? ''),
    createdKey: 'createdAt',
    // Already in the printed header block — don't repeat them in the body.
    metaKeys: ['reference', 'createdAt'],
    signatureLines: ['Received by', 'Signature & date'],
  },
  fields: [
    // — Application —
    { key: 'reference', label: 'Reference', table: true, readonly: true, group: 'Application' },
    { key: 'status', label: 'Status', type: 'select', table: true, required: true, group: 'Application', options: [
      { value: 'SUBMITTED', label: 'Submitted' },
      { value: 'UNDER_REVIEW', label: 'Under review' },
      { value: 'SHORTLISTED', label: 'Shortlisted' },
      { value: 'INTERVIEW_SCHEDULED', label: 'Interview scheduled' },
      { value: 'OFFER_MADE', label: 'Offer made' },
      { value: 'ACCEPTED', label: 'Accepted' },
      { value: 'REJECTED', label: 'Rejected' },
      { value: 'WITHDRAWN', label: 'Withdrawn' },
    ] },
    { key: 'createdAt', label: 'Date submitted', type: 'datetime', table: true, readonly: true, group: 'Application' },
    { key: 'updatedAt', label: 'Last updated', type: 'datetime', readonly: true, group: 'Application' },
    { key: 'letterUrl', label: 'Admission letter', readonly: true, group: 'Application' },

    // — Pupil —
    { key: 'pupilFirstName', label: 'First name', table: true, readonly: true, group: 'Pupil' },
    { key: 'pupilLastName', label: 'Last name', table: true, readonly: true, group: 'Pupil' },
    { key: 'pupilDob', label: 'Date of birth', type: 'date', readonly: true, group: 'Pupil' },
    { key: 'gender', label: 'Gender', readonly: true, group: 'Pupil' },
    // `options` on a read-only field is a lookup table, not an input: it turns
    // the stored enum into the label a reader expects on a printed sheet.
    { key: 'section', label: 'Section', table: true, readonly: true, group: 'Pupil', options: [
      { value: 'PRE_PRIMARY', label: 'Pre-Primary (KG1 to KG3)' },
      { value: 'LOWER_PRIMARY', label: 'Lower Primary (P.1 to P.3)' },
      { value: 'UPPER_PRIMARY', label: 'Upper Primary (P.4 to P.7)' },
    ] },
    { key: 'gradeApplyingFor', label: 'Class applying for', readonly: true, group: 'Pupil' },
    { key: 'residence', label: 'Residence', readonly: true, group: 'Pupil', options: [
      { value: 'DAY', label: 'Day' },
      { value: 'BOARDING', label: 'Boarding' },
    ] },

    // — Parent / guardian —
    { key: 'guardianName', label: 'Full name', readonly: true, group: 'Parent / guardian' },
    { key: 'relationship', label: 'Relationship', readonly: true, group: 'Parent / guardian' },
    { key: 'guardianEmail', label: 'Email', readonly: true, group: 'Parent / guardian' },
    { key: 'guardianPhone', label: 'Phone', readonly: true, group: 'Parent / guardian' },

    // — Review —
    { key: 'extraData', label: 'Additional answers', table: true, readonly: true, group: 'Review' },
    { key: 'decisionNote', label: 'Decision note', type: 'textarea', group: 'Review' },
  ],
};

export default function AdminAdmissionsPage() {
  return <ResourceManager config={config} />;
}
