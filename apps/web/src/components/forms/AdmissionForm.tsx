'use client';

import { useState } from 'react';
import { Field, SelectField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { PublicFieldInputs } from '@/components/forms/PublicFieldInputs';
import type { FormField } from '@/components/admin/FieldDesigner';

export function AdmissionForm({ extraFields = [] }: { extraFields?: FormField[] }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [reference, setReference] = useState('');
  const [extra, setExtra] = useState<Record<string, unknown>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const ref = `CPS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    try {
      const res = await fetch(
        `/api/admissions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, reference: ref, ...(extraFields.length ? { extraData: extra } : {}) }),
        },
      );
      if (!res.ok) {
        setStatus('error');
        return;
      }
      setReference(ref);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-line bg-paper p-8 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-maroon-700">
          <Icon name="shield-check" size={26} />
        </span>
        <h3 className="mt-4 text-xl">Application submitted</h3>
        <p className="mt-2 text-ink-soft">
          Keep your tracking reference safe, you can use it to follow your
          child&rsquo;s application status.
        </p>
        <p className="mt-4 inline-block rounded-xl bg-maroon-50 px-5 py-3 font-mono text-lg font-semibold text-maroon-800">
          {reference}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-line bg-paper p-6 sm:p-8">
      <fieldset className="space-y-5">
        <legend className="eyebrow mb-2">Pupil details</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Pupil first name" id="pupilFirstName" name="pupilFirstName" required />
          <Field label="Pupil last name" id="pupilLastName" name="pupilLastName" required />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Date of birth" id="pupilDob" name="pupilDob" type="date" required />
          <SelectField label="Section applying for" id="section" name="section" required defaultValue="">
            <option value="" disabled>Select section</option>
            <option value="PRE_PRIMARY">Pre-Primary (KG1 to KG3)</option>
            <option value="LOWER_PRIMARY">Lower Primary (P.1 to P.3)</option>
            <option value="UPPER_PRIMARY">Upper Primary (P.4 to P.7)</option>
          </SelectField>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Class / grade applying for" id="gradeApplyingFor" name="gradeApplyingFor" required placeholder="e.g. KG2 or P.3" />
          <SelectField label="Residence" id="residence" name="residence" required defaultValue="DAY">
            <option value="DAY">Day</option>
            <option value="BOARDING">Boarding</option>
          </SelectField>
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-6">
        <legend className="eyebrow mb-2">Parent / guardian</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" id="guardianName" name="guardianName" required />
          <Field label="Relationship" id="relationship" name="relationship" placeholder="Mother / Father / Guardian" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" id="guardianEmail" name="guardianEmail" type="email" required />
          <Field label="Phone" id="guardianPhone" name="guardianPhone" required placeholder="+256 …" />
        </div>
      </fieldset>

      {extraFields.length ? (
        <fieldset className="space-y-5 border-t border-line pt-6">
          <legend className="eyebrow mb-2">Additional information</legend>
          <PublicFieldInputs fields={extraFields} values={extra} onChange={(k, v) => setExtra((p) => ({ ...p, [k]: v }))} />
        </fieldset>
      ) : null}

      <p className="text-xs text-ink-muted">
        You will be able to upload the birth certificate and previous reports
        after submitting this form.
      </p>
      {status === 'error' ? (
        <p className="text-sm text-maroon-600">
          Could not submit your application. Please check your connection and try again.
        </p>
      ) : null}
      <Button type="submit" size="lg" icon="arrow-right" disabled={status === 'sending'}>
        {status === 'sending' ? 'Submitting…' : 'Submit application'}
      </Button>
    </form>
  );
}
