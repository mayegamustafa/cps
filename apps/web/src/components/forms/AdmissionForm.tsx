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

/** Answers to "How did you get to know about us?", ordered roughly by how often
 *  a school actually hears them. "Other" opens a free-text box so switching this
 *  field from open text to a list does not lose the answers it used to capture. */
const HEARD_ABOUT_OPTIONS = [
  'A friend or family member',
  'A current or former parent',
  'A pupil or alumnus of the school',
  'Passing by the school',
  'Facebook',
  'TikTok',
  'Instagram',
  'YouTube',
  'Google or a web search',
  'The school website',
  'Radio',
  'Television',
  'Newspaper or magazine',
  'Billboard, poster or signpost',
  'A school event or open day',
  'A church or mosque',
  'An employer or workplace',
];

/**
 * The contact/occupation/residence block the paper form repeats for the father,
 * the mother and the second contact person.
 */
function PersonFields({ prefix, required = false }: { prefix: string; required?: boolean }) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone contact" id={`${prefix}Phone`} name={`${prefix}Phone`} required={required} placeholder="+256 …" />
        <Field label="E-mail" id={`${prefix}Email`} name={`${prefix}Email`} type="email" required={required} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Occupation" id={`${prefix}Occupation`} name={`${prefix}Occupation`} />
        <Field label="Place of work" id={`${prefix}Workplace`} name={`${prefix}Workplace`} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Residence" id={`${prefix}Residence`} name={`${prefix}Residence`} placeholder="e.g. Rubaga" />
        <Field label="District" id={`${prefix}District`} name={`${prefix}District`} placeholder="e.g. Kampala" />
      </div>
    </>
  );
}

function Legend({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <legend className="mb-2">
      <span className="eyebrow">{children}</span>
      {hint ? <span className="mt-1 block text-xs font-normal text-ink-muted">{hint}</span> : null}
    </legend>
  );
}

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
  const [heardAbout, setHeardAbout] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries()) as Record<string, string>;
    // Fold the "Other" free text back into the single stored answer, so the
    // column, the admin view and the printed form all stay unchanged.
    const otherText = (payload.heardAboutUsOther ?? '').trim();
    if (payload.heardAboutUs === 'Other') {
      payload.heardAboutUs = otherText ? `Other — ${otherText}` : 'Other';
    }
    delete payload.heardAboutUsOther;
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
      // Kept in memory so the parent can print without a second round trip.
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
            <Icon name="download" size={18} /> Print this form and bring it to the school
          </h4>
          <p className="mt-1.5 text-sm text-ink-soft">
            Your application is not complete until you come to the school in person.
            Print the form below and <strong className="text-maroon-800">come with your child</strong> and
            the <strong className="text-maroon-800">interview fee</strong> on any interview day.
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
            <li className="flex gap-2"><Icon name="users" size={16} className="mt-0.5 shrink-0 text-maroon-700" /> Come together with the child being admitted — the interview is with them.</li>
            <li className="flex gap-2"><Icon name="clock" size={16} className="mt-0.5 shrink-0 text-maroon-700" /> Interviews run Monday to Friday, 9:00am to 12:00 noon.</li>
            <li className="flex gap-2"><Icon name="shield-check" size={16} className="mt-0.5 shrink-0 text-maroon-700" /> Interview fee: UGX 50,000 (non-refundable), paid in cash on the day.</li>
            <li className="flex gap-2"><Icon name="image" size={16} className="mt-0.5 shrink-0 text-maroon-700" /> 1 passport photo each for the child, the mother and the father.</li>
            <li className="flex gap-2"><Icon name="book-open" size={16} className="mt-0.5 shrink-0 text-maroon-700" /> Photocopies of the recent report card and the immunization card or birth certificate.</li>
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
      <p className="rounded-xl bg-paper-dark/60 px-4 py-3 text-sm text-ink-soft">
        This is the school&rsquo;s full application form. Only the fields marked
        <span className="mx-1 font-semibold text-maroon-700">*</span> are required — fill in
        what you can, print your copy at the end, and complete anything left blank by hand
        at the interview.
      </p>

      <fieldset className="space-y-5">
        <Legend>A · Pupil&rsquo;s particulars</Legend>
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
          <Field label="Nationality" id="nationality" name="nationality" placeholder="e.g. Ugandan" />
          <Field label="Religion" id="religion" name="religion" />
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
        <Legend hint="This is the parent or guardian we will contact about the application.">
          B (i) · Father / guardian
        </Legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Father / guardian's name" id="guardianName" name="guardianName" required />
          <Field label="If guardian, relationship with the child" id="relationship" name="relationship" placeholder="Mother / Father / Guardian" />
        </div>
        <PersonFields prefix="guardian" required />
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-6">
        <Legend>B (ii) · Mother</Legend>
        <Field label="Mother's names" id="motherName" name="motherName" />
        <PersonFields prefix="mother" />
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-6">
        <Legend hint="Someone we can reach if you cannot be contacted.">
          B (iii) · Other immediate contact person
        </Legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" id="contactName" name="contactName" />
          <Field label="Relationship to the child" id="contactRelationship" name="contactRelationship" />
        </div>
        <PersonFields prefix="contact" />
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-6">
        <Legend hint="Please attach a copy of the report card when you come for the interview.">
          C · Former school&rsquo;s details
        </Legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Former school" id="formerSchool" name="formerSchool" placeholder="Leave blank if this is the first school" />
          <Field label="Former class attended" id="formerClass" name="formerClass" />
        </div>
        <SelectField
          label="How did you get to know about us?"
          id="heardAboutUs"
          name="heardAboutUs"
          value={heardAbout}
          onChange={(e) => setHeardAbout(e.target.value)}
        >
          <option value="">Select an answer</option>
          {HEARD_ABOUT_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
          <option value="Other">Other</option>
        </SelectField>
        {heardAbout === 'Other' ? (
          <Field
            label="Please tell us how"
            id="heardAboutUsOther"
            name="heardAboutUsOther"
            required
            placeholder="How did you hear about the school?"
          />
        ) : null}
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-6">
        <Legend>D · Health background</Legend>
        <Field label="State if the child has any special illness" id="specialIllness" name="specialIllness" placeholder="None, or briefly describe" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name of any child you already have in our school" id="siblingName" name="siblingName" />
          <Field label="Their class" id="siblingClass" name="siblingClass" />
        </div>
      </fieldset>

      {extraFields.length ? (
        <fieldset className="space-y-5 border-t border-line pt-6">
          <Legend>Additional information</Legend>
          <PublicFieldInputs fields={extraFields} values={extra} onChange={(k, v) => setExtra((p) => ({ ...p, [k]: v }))} />
        </fieldset>
      ) : null}

      <fieldset className="space-y-5 border-t border-line pt-6">
        <Legend hint="You will sign the printed copy by hand at the school.">Declaration</Legend>
        <Field label="Parent / guardian's name" id="declarationName" name="declarationName" placeholder="Your full name, as it will be signed" />
      </fieldset>

      <div className="rounded-xl border border-maroon-700/25 bg-maroon-50/50 p-4 text-sm text-ink-soft">
        <p className="font-semibold text-maroon-900">After you submit</p>
        <p className="mt-1">
          You will be able to print this form and must bring it to the school{' '}
          <strong className="text-maroon-800">together with your child</strong> and the{' '}
          <strong className="text-maroon-800">UGX 50,000 interview fee</strong>, plus the
          passport photos, report card and birth certificate or immunization card.
        </p>
      </div>

      {status === 'error' ? (
        <p className="text-sm text-maroon-600">
          Could not submit your application. Please check your connection and try again.
        </p>
      ) : null}
      <Button type="submit" size="lg" icon="arrow-right" disabled={status === 'sending'} className="w-full sm:w-auto">
        {status === 'sending' ? 'Submitting…' : 'Submit application'}
      </Button>
    </form>
  );
}
