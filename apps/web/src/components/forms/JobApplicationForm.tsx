'use client';

import { useState } from 'react';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { PublicFieldInputs } from '@/components/forms/PublicFieldInputs';
import type { FormField } from '@/components/admin/FieldDesigner';

export function JobApplicationForm({ role, vacancyId, extraFields = [] }: { role: string; vacancyId?: string; extraFields?: FormField[] }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [extra, setExtra] = useState<Record<string, unknown>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const core = Object.fromEntries(new FormData(e.currentTarget).entries());
    const data = { ...core, ...(extraFields.length ? { extraData: extra } : {}) };
    if (!vacancyId) {
      // No live vacancy id (demo content) — confirm optimistically.
      setStatus('done');
      return;
    }
    try {
      const res = await fetch(`/api/careers/vacancies/${vacancyId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setStatus(res.ok ? 'done' : 'error');
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
        <h3 className="mt-4 text-xl">Application received</h3>
        <p className="mt-2 text-ink-soft">
          Thank you for applying for the <strong>{role}</strong> position. Our HR
          team will be in touch if you are shortlisted.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-line bg-paper p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" id="firstName" name="firstName" required />
        <Field label="Last name" id="lastName" name="lastName" required />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" id="email" name="email" type="email" required />
        <Field label="Phone" id="phone" name="phone" required />
      </div>
      <Field
        label="Link to your CV"
        id="cvUrl"
        name="cvUrl"
        type="url"
        required
        placeholder="https://… (Google Drive, Dropbox, etc.)"
        hint="Share a public link to your CV. Direct file upload is enabled once Cloudflare R2 is connected."
      />
      <Field
        label="Link to cover letter (optional)"
        id="coverLetterUrl"
        name="coverLetterUrl"
        type="url"
        placeholder="https://…"
      />
      {extraFields.length ? (
        <div className="space-y-5 border-t border-line pt-5">
          <PublicFieldInputs fields={extraFields} values={extra} onChange={(k, v) => setExtra((p) => ({ ...p, [k]: v }))} />
        </div>
      ) : null}
      {status === 'error' ? (
        <p className="text-sm text-maroon-600">Could not submit your application. Please try again.</p>
      ) : null}
      <Button type="submit" size="lg" icon="arrow-right" disabled={status === 'sending'}>
        {status === 'sending' ? 'Submitting…' : 'Submit application'}
      </Button>
    </form>
  );
}
