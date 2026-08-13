'use client';

import { useState } from 'react';
import { Field, SelectField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { PublicFieldInputs } from '@/components/forms/PublicFieldInputs';
import { buildAdmissionPrintout, type SchoolInfo } from '@/components/forms/admissionPrintout';
import type { FormField } from '@/components/admin/FieldDesigner';

const SECTION_LABELS: Record<string, string> = {
  PRE_PRIMARY: 'Pre-Primary (KG1 to KG3)',
  LOWER_PRIMARY: 'Lower Primary (P.1 to P.3)',
  UPPER_PRIMARY: 'Upper Primary (P.4 to P.7)',
};

export function AdmissionForm({
  extraFields = [],
  school,
}: {
  extraFields?: FormField[];
  school: SchoolInfo;
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [reference, setReference] = useState('');
  const [submitted, setSubmitted] = useState<{ at: Date; values: Record<string, string> } | null>(null);
  const [extra, setExtra] = useState<Record<string, unknown>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries()) as Record<string, string>;
    const ref = `CPS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    try {
      const res = await fetch(`/api/admissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, reference: ref, ...(extraFields.length ? { extraData: extra } : {}) }),
      });
      if (!res.ok) {
        setStatus('error');
        return;
      }
      setReference(ref);
      // Keep the answers in memory so the parent can print their copy without a
      // second round trip — the submitted values never leave this page.
      setSubmitted({
        at: new Date(),
        values: {
          ...payload,
          residenceLabel: payload.residence === 'BOARDING' ? 'Boarding' : 'Day',
          sectionLabel: SECTION_LABELS[payload.section] ?? payload.section,
        },
      });
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  function printCopy() {
    if (!submitted) return;
    // The print window is about:blank, so a relative logo path would not load.
    const logoUrl = school.logoUrl
      ? new URL(school.logoUrl, window.location.origin).href
      : undefined;
    const html = buildAdmissionPrintout(
      { reference, submittedAt: submitted.at, values: submitted.values },
      { ...school, logoUrl },
    );
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      html.replace('</body>', '<script>window.onload=function(){window.print();}<\/script></body>'),
    );
    w.document.close();
  }

  if (status === 'done') {
    const v = submitted?.values ?? {};
    return (
      <div className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
        <div className="text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-maroon-700">
            <Icon name="shield-check" size={26} />
          </span>
          <h3 className="mt-4 text-xl">Application submitted</h3>
          <p className="mt-2 text-ink-soft">
            Keep your tracking reference safe — you can use it to follow your
            child&rsquo;s application status.
          </p>
          <p className="mt-4 inline-block rounded-xl bg-maroon-50 px-5 py-3 font-mono text-lg font-semibold text-maroon-800">
            {reference}
          </p>
        </div>

        <div className="mt-7 rounded-xl border border-maroon-700/25 bg-maroon-50/50 p-5">
          <h4 className="flex items-center gap-2 font-semibold text-maroon-900">
            <Icon name="download" size={18} /> Print your copy for the interview
          </h4>
          <p className="mt-1.5 text-sm text-ink-soft">
            Print this application and bring it to the school with your child on the
            interview day. Any line we didn&rsquo;t ask for online is left blank for you
            to complete by hand.
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
            <li className="flex gap-2"><Icon name="clock" size={16} className="mt-0.5 shrink-0 text-maroon-700" /> Interviews run Monday to Friday, 9:00am to 12:00 noon.</li>
            <li className="flex gap-2"><Icon name="shield-check" size={16} className="mt-0.5 shrink-0 text-maroon-700" /> Registration / interview fee: UGX 50,000 (non-refundable), paid in cash on the day.</li>
            <li className="flex gap-2"><Icon name="image" size={16} className="mt-0.5 shrink-0 text-maroon-700" /> Bring 1 passport photo each for the child, mother and father.</li>
            <li className="flex gap-2"><Icon name="book-open" size={16} className="mt-0.5 shrink-0 text-maroon-700" /> Bring photocopies of the recent report card and the immunization card or birth certificate.</li>
          </ul>
          <Button onClick={printCopy} size="lg" icon="arrow-right" className="mt-5 w-full sm:w-auto">
            Print / Save as PDF
          </Button>
        </div>

        <dl className="mt-7 grid gap-x-8 gap-y-2 border-t border-line pt-6 text-sm sm:grid-cols-2">
          {[
            ['Pupil', `${v.pupilFirstName ?? ''} ${v.pupilLastName ?? ''}`.trim()],
            ['Class applied for', v.gradeApplyingFor],
            ['Section', v.sectionLabel],
            ['Day / Boarding', v.residenceLabel],
            ['Parent / guardian', v.guardianName],
            ['Phone', v.guardianPhone],
          ].map(([label, value]) =>
            value ? (
              <div key={label} className="flex justify-between gap-4 sm:justify-start">
                <dt className="text-ink-muted">{label}</dt>
                <dd className="font-medium text-ink">{value}</dd>
              </div>
            ) : null,
          )}
        </dl>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-line bg-paper p-6 sm:p-8">
      <fieldset className="space-y-5">
        <legend className="eyebrow mb-2">A · Pupil&rsquo;s particulars</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Surname" id="pupilLastName" name="pupilLastName" required />
          <Field label="Other names" id="pupilFirstName" name="pupilFirstName" required />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Date of birth" id="pupilDob" name="pupilDob" type="date" required />
          <SelectField label="Gender" id="gender" name="gender" defaultValue="">
            <option value="" disabled>Select gender</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </SelectField>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Class applying for" id="gradeApplyingFor" name="gradeApplyingFor" required placeholder="e.g. KG2 or P.3" />
          <SelectField label="Section applying for" id="section" name="section" required defaultValue="">
            <option value="" disabled>Select section</option>
            <option value="PRE_PRIMARY">Pre-Primary (KG1 to KG3)</option>
            <option value="LOWER_PRIMARY">Lower Primary (P.1 to P.3)</option>
            <option value="UPPER_PRIMARY">Upper Primary (P.4 to P.7)</option>
          </SelectField>
        </div>
        <SelectField label="Day or Boarding" id="residence" name="residence" required defaultValue="DAY">
          <option value="DAY">Day</option>
          <option value="BOARDING">Boarding</option>
        </SelectField>
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-6">
        <legend className="eyebrow mb-2">B · Parent / guardian</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" id="guardianName" name="guardianName" required />
          <Field label="Relationship to the child" id="relationship" name="relationship" placeholder="Mother / Father / Guardian" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" id="guardianEmail" name="guardianEmail" type="email" required />
          <Field label="Phone" id="guardianPhone" name="guardianPhone" required placeholder="+256 …" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Residence" id="guardianResidence" name="guardianResidence" placeholder="e.g. Rubaga" />
          <Field label="District" id="guardianDistrict" name="guardianDistrict" placeholder="e.g. Kampala" />
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-6">
        <legend className="eyebrow mb-2">C · Former school</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Former school" id="formerSchool" name="formerSchool" placeholder="Leave blank if this is the first school" />
          <Field label="Former class attended" id="formerClass" name="formerClass" />
        </div>
        <Field label="How did you get to know about us?" id="heardAboutUs" name="heardAboutUs" placeholder="A friend, social media, a school event…" />
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-6">
        <legend className="eyebrow mb-2">D · Health &amp; family</legend>
        <Field label="Does the child have any special illness?" id="specialIllness" name="specialIllness" placeholder="None, or briefly describe" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name of any child already in our school" id="siblingName" name="siblingName" />
          <Field label="Their class" id="siblingClass" name="siblingClass" />
        </div>
      </fieldset>

      {extraFields.length ? (
        <fieldset className="space-y-5 border-t border-line pt-6">
          <legend className="eyebrow mb-2">Additional information</legend>
          <PublicFieldInputs fields={extraFields} values={extra} onChange={(k, v) => setExtra((p) => ({ ...p, [k]: v }))} />
        </fieldset>
      ) : null}

      <p className="text-xs text-ink-muted">
        After submitting you can print a copy of this form to bring to the school on
        the interview day, along with the passport photos, report card and birth
        certificate or immunization card.
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
