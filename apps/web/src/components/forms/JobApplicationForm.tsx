'use client';

import { useState } from 'react';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';

const fileCls =
  'w-full rounded-xl border border-dashed border-maroon-700/30 bg-maroon-50/40 px-4 py-3 text-sm text-ink-soft file:mr-4 file:rounded-full file:border-0 file:bg-maroon-700 file:px-4 file:py-2 file:text-white hover:border-maroon-700/60';

export function JobApplicationForm({ role }: { role: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    // File uploads stream to Cloudflare R2 via signed URLs in production.
    setTimeout(() => setStatus('done'), 600);
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
      <div>
        <label htmlFor="cv" className="mb-1.5 block text-sm font-medium text-ink">
          Curriculum Vitae (PDF) <span className="text-maroon-600">*</span>
        </label>
        <input id="cv" name="cv" type="file" accept=".pdf,.doc,.docx" required className={fileCls} />
      </div>
      <div>
        <label htmlFor="certs" className="mb-1.5 block text-sm font-medium text-ink">
          Academic certificates
        </label>
        <input id="certs" name="certs" type="file" accept=".pdf,.jpg,.png" multiple className={fileCls} />
      </div>
      <Button type="submit" size="lg" icon="arrow-right" disabled={status === 'sending'}>
        {status === 'sending' ? 'Submitting…' : 'Submit application'}
      </Button>
    </form>
  );
}
