import type { Metadata } from 'next';
import { assertPageEnabled } from '@/lib/page-guard';
import { ConfigurablePageHero } from '@/components/ui/ConfigurablePageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Accordion } from '@/components/ui/Accordion';
import { AdmissionForm } from '@/components/forms/AdmissionForm';
import { admissionSteps, feeStructure, faqs } from '@/lib/content';
import { getSiteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Admissions',
  description:
    'Apply online to City Parents School. Admission process, fee structure, downloads and frequently asked questions.',
};

export default async function AdmissionsPage() {
  await assertPageEnabled('admissions');
  const config = await getSiteConfig();
  return (
    <>
      <ConfigurablePageHero page="admissions"
        eyebrow="Admissions 2026 / 2027"
        title="Begin your child’s journey with us."
        intro="Our online admissions process makes it simple to apply, upload documents and track your application, from anywhere, at any time."
        crumbs={[{ label: 'Admissions' }]}
        image="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=2000&q=70"
      />

      {/* Process */}
      <section className="py-24">
        <div className="container-page">
          <SectionHeading align="center" eyebrow="How to apply" title="Four simple steps to enrolment" />
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {admissionSteps.map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-line bg-paper p-7">
                <span className="font-display text-5xl text-gold-200">{s.step}</span>
                <h3 className="mt-3 text-xl">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="bg-paper-dark py-24">
        <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeading
              eyebrow="Online application"
              title="Start your application"
              intro="Complete the form and we will create a secure tracking reference for your child’s application."
            />
            <div className="mt-8 space-y-4">
              {feeStructure.length ? (
                <Button href="/downloads" variant="outline" icon="arrow-right">
                  Download prospectus & forms
                </Button>
              ) : null}
            </div>
          </div>
          <AdmissionForm extraFields={config.admissionsFields ?? []} />
        </div>
      </section>

      {/* Fees */}
      <section className="py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Investment" title="Fee structure 2026" />
          <div className="mt-10 overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-left">
              <thead className="bg-maroon-900 text-white">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold">Level</th>
                  <th className="px-6 py-4 text-sm font-semibold">Termly</th>
                  <th className="px-6 py-4 text-sm font-semibold">Annual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-paper">
                {feeStructure.map((f) => (
                  <tr key={f.level}>
                    <td className="px-6 py-4 font-medium text-ink">{f.level}</td>
                    <td className="px-6 py-4 text-ink-soft">{f.termly}</td>
                    <td className="px-6 py-4 text-ink-soft">{f.annual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-ink-muted">
            Fees are indicative and exclude optional transport, meals and uniform.
            Contact admissions for a detailed schedule.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-paper-dark py-24">
        <div className="container-page max-w-3xl">
          <SectionHeading align="center" eyebrow="Questions" title="Frequently asked questions" />
          <div className="mt-10">
            <Accordion items={faqs} />
          </div>
        </div>
      </section>
    </>
  );
}
