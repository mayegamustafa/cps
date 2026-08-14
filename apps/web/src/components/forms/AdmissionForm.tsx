'use client';

import { useState } from 'react';
import { Field, SelectField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { PublicFieldInputs } from '@/components/forms/PublicFieldInputs';
import { buildAdmissionPrintout, type SchoolInfo } from '@/components/forms/admissionPrintout';
import type { FormField } from '@/components/admin/FieldDesigner';

const SECTION_LABELS: Record<string, string> = {
  PRE_PRIMARY: 'Pre-Primary',
  LOWER_PRIMARY: 'Lower Primary',
  UPPER_PRIMARY: 'Upper Primary',
};

/**
 * Classes open to new applicants.
 *
 * P.7 is deliberately absent: it is the PLE candidate year, and the school does
 * not take new pupils into it. A list also spares a parent typing "kg 2", "KG2"
 * and "Kindergarten 2" into what used to be a free-text box.
 */
const CLASS_OPTIONS: { value: string; label: string; section: string }[] = [
  { value: 'KG1', label: 'KG1 (Baby)', section: 'PRE_PRIMARY' },
  { value: 'KG2', label: 'KG2 (Middle)', section: 'PRE_PRIMARY' },
  { value: 'KG3', label: 'KG3 (Top / Pre)', section: 'PRE_PRIMARY' },
  { value: 'P.1', label: 'P.1', section: 'LOWER_PRIMARY' },
  { value: 'P.2', label: 'P.2', section: 'LOWER_PRIMARY' },
  { value: 'P.3', label: 'P.3', section: 'LOWER_PRIMARY' },
  { value: 'P.4', label: 'P.4', section: 'UPPER_PRIMARY' },
  { value: 'P.5', label: 'P.5', section: 'UPPER_PRIMARY' },
  { value: 'P.6', label: 'P.6', section: 'UPPER_PRIMARY' },
];

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
  const [grade, setGrade] = useState('');
  const section = CLASS_OPTIONS.find((c) => c.value === grade)?.section ?? '';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries()) as Record<string, string>;

    // One "full name" box on screen, two columns in the database. Splitting at
    // the LAST space keeps the parent's own word order intact, because every
    // display joins the two back as "first last" - so whatever they typed,
    // in whichever order Ugandan families use, reads back exactly the same.
    const fullName = (payload.pupilName ?? '').trim().replace(/\s+/g, ' ');
    const cut = fullName.lastIndexOf(' ');
    payload.pupilFirstName = cut === -1 ? fullName : fullName.slice(0, cut);
    payload.pupilLastName = cut === -1 ? '' : fullName.slice(cut + 1);
    delete payload.pupilName;
    // Fold the "Other" free text back into the single stored answer, so the
    // column, the admin view and the printed form all stay unchanged.
    const otherText = (payload.heardAboutUsOther ?? '').trim();
    if (payload.heardAboutUs === 'Other') {
      payload.heardAboutUs = otherText ? `Other: ${otherText}` : 'Other';
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
            Keep your tracking reference safe. You can use it to follow your
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
            <li className="flex gap-2"><Icon name="users" size={16} className="mt-0.5 shrink-0 text-maroon-700" /> Come together with the child being admitted. The interview is with them.</li>
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
        Just the essentials. This takes about a minute. You will print a copy at the end
        and complete the rest of the school&rsquo;s form by hand at the interview.
        Fields marked <span className="font-semibold text-maroon-700">*</span> are required.
      </p>

      <fieldset className="space-y-5">
        <Legend>Pupil</Legend>
        <Field
          label="Pupil's full name"
          id="pupilName"
          name="pupilName"
          required
          autoComplete="name"
          placeholder="As written on the birth certificate"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Date of birth" id="pupilDob" name="pupilDob" type="date" required />
          <SelectField label="Gender" id="gender" name="gender" defaultValue="">
            <option value="" disabled>Select gender</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </SelectField>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Class applying for"
            id="gradeApplyingFor"
            name="gradeApplyingFor"
            required
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          >
            <option value="" disabled>Select a class</option>
            {CLASS_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </SelectField>
          <SelectField label="Day or Boarding" id="residence" name="residence" required defaultValue="DAY">
            <option value="DAY">Day</option>
            <option value="BOARDING">Boarding</option>
          </SelectField>
        </div>
        {/* Derived, not asked: the class already determines the section, and a
            separate dropdown only creates the chance of picking "KG2" with
            "Upper Primary". */}
        <input type="hidden" name="section" value={section} />
        {section ? (
          <p className="text-sm text-ink-muted">
            Section: <span className="font-medium text-ink">{SECTION_LABELS[section]}</span>
          </p>
        ) : null}
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-6">
        <Legend hint="This is who we will contact about the application.">Parent / guardian</Legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" id="guardianName" name="guardianName" required />
          <Field label="Relationship to the child" id="relationship" name="relationship" placeholder="Mother / Father / Guardian" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone contact" id="guardianPhone" name="guardianPhone" required placeholder="+256 …" />
          <Field label="E-mail" id="guardianEmail" name="guardianEmail" type="email" required />
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-6">
        <Legend>A little more</Legend>
        <Field label="Former school" id="formerSchool" name="formerSchool" placeholder="Leave blank if this is the first school" />
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

      {extraFields.length ? (
        <fieldset className="space-y-5 border-t border-line pt-6">
          <Legend>Additional information</Legend>
          <PublicFieldInputs fields={extraFields} values={extra} onChange={(k, v) => setExtra((p) => ({ ...p, [k]: v }))} />
        </fieldset>
      ) : null}

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
