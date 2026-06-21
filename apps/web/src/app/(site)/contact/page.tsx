import type { Metadata } from 'next';
import { ConfigurablePageHero } from '@/components/ui/ConfigurablePageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Icon } from '@/components/Icon';
import { ContactForm } from '@/components/forms/ContactForm';
import { getSiteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with City Parents School, visit us on Kabaka Anjagala Road, Kampala, or send us a message.',
};

export default async function ContactPage() {
  const site = await getSiteConfig();
  return (
    <>
      <ConfigurablePageHero page="contact"
        eyebrow="Get in touch"
        title="We would love to hear from you."
        intro="Whether you are a prospective family, a current parent or a partner, our team is here to help."
        crumbs={[{ label: 'Contact' }]}
      />

      <section className="py-24">
        <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeading eyebrow="Reach us" title="Contact details" />
            <dl className="mt-8 space-y-6">
              {[
                { icon: 'map-pin', label: 'Visit', value: `${site.address.line1}, ${site.address.poBox}, ${site.address.city}, ${site.address.country}` },
                { icon: 'phone', label: 'Call', value: site.contact.phone, href: `tel:${site.contact.phone}` },
                { icon: 'mail', label: 'Email', value: site.contact.email, href: `mailto:${site.contact.email}` },
                { icon: 'whatsapp', label: 'WhatsApp', value: 'Chat with us', href: `https://wa.me/${site.contact.whatsapp}` },
                { icon: 'clock', label: 'Office hours', value: site.home.visit.officeHours },
              ].map((c) => (
                <div key={c.label} className="flex items-start gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-maroon-700">
                    <Icon name={c.icon as 'map-pin'} size={20} />
                  </span>
                  <div>
                    <dt className="text-sm font-semibold uppercase tracking-wide text-gold-600">{c.label}</dt>
                    <dd className="mt-0.5 text-ink-soft">
                      {c.href ? <a href={c.href} className="hover:text-maroon-700">{c.value}</a> : c.value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <SectionHeading eyebrow="Message us" title="Send an enquiry" />
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="pb-24">
        <div className="container-page">
          <div className="overflow-hidden rounded-2xl border border-line shadow-soft">
            <iframe
              title="City Parents School location map"
              className="h-[460px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${site.coords.lat},${site.coords.lng}&z=16&output=embed`}
            />
          </div>
        </div>
      </section>
    </>
  );
}
