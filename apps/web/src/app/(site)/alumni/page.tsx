import type { Metadata } from 'next';
import { assertPageEnabled } from '@/lib/page-guard';
import { ConfigurablePageHero } from '@/components/ui/ConfigurablePageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { getAlumni } from '@/lib/public-data';

export const metadata: Metadata = {
  title: 'Alumni',
  description:
    'The City Parents School alumni community, register, reconnect, share your story and give back.',
};

export default async function AlumniPage() {
  await assertPageEnabled('alumni');
  const alumni = await getAlumni();
  return (
    <>
      <ConfigurablePageHero page="alumni"
        eyebrow="Alumni Community"
        title="Once a City Parent, always a City Parent."
        intro="Our alumni lead in every field across Uganda and the world. Reconnect with classmates, share your journey and help shape the next generation."
        crumbs={[{ label: 'Alumni' }]}
        image="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=2000&q=70"
      />

      {/* Actions */}
      <section className="py-24">
        <div className="container-page">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: 'users', title: 'Register', body: 'Join the official alumni directory and stay connected.', cta: 'Register now', href: '/contact' },
              { icon: 'quote', title: 'Share your story', body: 'Inspire current pupils with your achievements.', cta: 'Submit a story', href: '/contact' },
              { icon: 'heart-hand', title: 'Give back', body: 'Support bursaries, facilities and school initiatives.', cta: 'Make a donation', href: '/contact' },
            ].map((c) => (
              <div key={c.title} className="flex flex-col rounded-2xl border border-line bg-paper p-8">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-maroon-700 text-gold-300">
                  <Icon name={c.icon as 'users'} size={26} />
                </span>
                <h3 className="mt-6 text-2xl">{c.title}</h3>
                <p className="mt-2 flex-1 text-ink-soft">{c.body}</p>
                <Button href={c.href} variant="outline" className="mt-6 self-start" icon="arrow-right">{c.cta}</Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notable alumni */}
      <section className="bg-paper-dark py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Our community" title="Where our graduates are today" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {alumni.map((a, i) => (
              <div key={i} className="rounded-2xl border border-line bg-paper p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-400 font-display text-2xl text-maroon-900">
                  {a.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <h3 className="mt-4 text-lg">{a.name}</h3>
                <p className="text-sm font-semibold text-maroon-700">{a.role}</p>
                <p className="text-sm text-ink-muted">{a.org}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-gold-600">Class of {a.year}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reunion CTA */}
      <section className="py-24">
        <div className="container-page">
          <div className="rounded-3xl bg-maroon-900 px-8 py-14 text-center text-white sm:px-16">
            <span className="eyebrow !text-gold-300 justify-center">Save the date</span>
            <h2 className="mt-4 !text-white">Annual Alumni Reunion · December 2026</h2>
            <p className="mx-auto mt-4 max-w-xl text-paper/80">
              Join us back on campus for an evening of reconnection, memories and celebration.
            </p>
            <Button href="/contact" variant="gold" size="lg" className="mt-8" icon="arrow-right">
              Reserve your place
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
