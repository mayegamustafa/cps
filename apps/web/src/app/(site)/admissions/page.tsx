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

      {/* Process. On a phone these four cards used to fill more than a screen
          before the form came into view, so they are compact rows there and
          full cards from `md` up. */}
      <section className="section">
        <div className="container-page">
          <SectionHeading align="center" eyebrow="How to apply" title="Four simple steps to enrolment" />
          <ol className="mt-8 grid gap-3 md:mt-14 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {admissionSteps.map((s) => (
              <li
                key={s.step}
                className="flex items-start gap-4 rounded-2xl border border-line bg-paper p-4 md:block md:p-7"
              >
                <span className="font-display text-3xl leading-none text-gold-300 md:text-5xl md:text-gold-200">
                  {s.step}
                </span>
                <div className="md:mt-3">
                  <h3 className="text-base md:text-xl">{s.title}</h3>
                  <p className="mt-1 text-sm text-ink-soft md:mt-2">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-7 sm:hidden">
            <Button href="#apply" size="lg" icon="arrow-right" className="w-full">Start your application</Button>
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="section bg-paper-dark scroll-mt-20">
        <div className="container-page grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <div>
            <SectionHeading
              eyebrow="Online application"
              title="Start your application"
              intro="Complete the form and we will create a secure tracking reference for your child’s application."
            />
            <div className="mt-6 hidden lg:mt-8 lg:block">
              <Button href="/downloads" variant="outline" icon="arrow-right">
                Download prospectus & forms
              </Button>
            </div>
          </div>
          <AdmissionForm
            extraFields={config.admissionsFields ?? []}
            school={{
              name: config.brand.name,
              poBox: config.address.poBox,
              city: config.address.city,
              phone: config.contact.phone,
              email: config.contact.email,
              motto: config.tagline,
              logoUrl: config.brand.logoUrl,
            }}
          />
        </div>
      </section>

      {/* Fees — request via WhatsApp / admissions office */}
      <section className="section">
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
      <section className="section bg-paper-dark">
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
