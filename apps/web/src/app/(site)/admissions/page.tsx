import type { Metadata } from 'next';
import { assertPageEnabled } from '@/lib/page-guard';
import { ConfigurablePageHero } from '@/components/ui/ConfigurablePageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { Accordion } from '@/components/ui/Accordion';
import { AdmissionForm } from '@/components/forms/AdmissionForm';
import { admissionSteps, faqs } from '@/lib/content';
import { waLink } from '@/lib/site';
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
            <div className="mt-8">
              <Button href="/downloads" variant="outline" icon="arrow-right">
                Download prospectus & forms
              </Button>
            </div>
          </div>
          <AdmissionForm extraFields={config.admissionsFields ?? []} />
        </div>
      </section>

      {/* Fees — request via WhatsApp / admissions office */}
      <section className="py-24">
        <div className="container-page">
          <div className="mx-auto max-w-3xl rounded-3xl border border-line bg-paper-dark/40 p-8 text-center sm:p-12">
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-maroon-700 text-gold-300">
              <Icon name="mail" size={26} />
            </span>
            <h2 className="mt-6 text-2xl">Request the fee structure</h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-soft">
              For our current fees and a detailed schedule, please reach out to the admissions
              office and we&rsquo;ll share it with you right away.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={waLink(config.contact.whatsapp, 'Hello, I would like to request the fee structure for City Parents School.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-maroon-700 px-6 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-maroon-800"
              >
                <Icon name="whatsapp" size={18} /> Request via WhatsApp
              </a>
              <Button href="/contact" variant="outline" icon="arrow-right">Contact admissions</Button>
            </div>
          </div>
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
