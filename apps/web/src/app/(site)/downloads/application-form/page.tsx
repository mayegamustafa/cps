import type { Metadata } from 'next';
import { getSiteConfig } from '@/lib/site-config';
import { buildAdmissionPrintout } from '@/components/forms/admissionPrintout';
import { PrintableDocument } from '@/components/PrintableDocument';

export const metadata: Metadata = {
  title: 'Admission Application Form',
  description:
    'Print the blank City Parents School new pupil application form, complete it by hand and bring it to the school with your child.',
};

/**
 * The blank application form offered on the Downloads page.
 *
 * Generated from the same builder as the copy a parent gets after applying
 * online, so the paper the office receives is identical either way, and there is
 * no PDF to re-upload whenever the form changes. Fee amounts are left off: the
 * school gives those out by phone, and a printed figure is the one thing on a
 * form that goes stale without anyone noticing.
 */
export default async function BlankApplicationFormPage() {
  const config = await getSiteConfig();

  const html = buildAdmissionPrintout(
    { reference: '', submittedAt: new Date(), values: {} },
    {
      name: config.brand.name,
      poBox: config.address.poBox,
      city: config.address.city,
      phone: config.contact.phone,
      email: config.contact.email,
      motto: config.tagline,
      logoUrl: config.brand.logoUrl,
    },
    { includeFees: false },
  );

  return (
    <PrintableDocument
      title="Admission Application Form"
      intro="Print this blank form, fill it in by hand, and bring it to the school together with your child on any interview day. You can also apply online instead."
      html={html}
      backHref="/downloads"
      backLabel="Back to downloads"
      altHref="/admissions#apply"
      altLabel="Apply online instead"
    />
  );
}
