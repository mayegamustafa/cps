import type { Metadata } from 'next';
import { ConfigurablePageHero } from '@/components/ui/ConfigurablePageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { getSiteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Virtual Tour',
  description:
    'Explore the City Parents School campus from anywhere with our immersive 360° virtual tour.',
};

export default async function VirtualTourPage() {
  const { virtualTour: vt } = await getSiteConfig();

  return (
    <>
      <ConfigurablePageHero page="virtual-tour"
        eyebrow="Virtual Tour"
        title="Walk our campus from anywhere."
        intro="Take an immersive 360° tour of City Parents School, explore our classrooms, laboratories, library, sports facilities and more, all from your device."
        crumbs={[{ label: 'Virtual Tour' }]}
      />

      {/* 360 viewer */}
      <section className="py-16">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-2xl border border-line">
            {vt.embedUrl ? (
              <iframe
                src={vt.embedUrl}
                title="Virtual campus tour"
                className="aspect-[16/9] w-full"
                allow="accelerometer; autoplay; gyroscope; xr-spatial-tracking; fullscreen"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <div
                className="flex aspect-[16/9] items-center justify-center bg-cover bg-center"
                style={{ backgroundImage: `url('${vt.viewerImage}')` }}
              >
                <div className="flex flex-col items-center gap-3 rounded-2xl bg-maroon-950/40 px-10 py-8 text-white backdrop-blur-sm">
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold-400 text-maroon-900">
                    <Icon name="play" size={30} />
                  </span>
                  <span className="font-display text-xl">Tour coming soon</span>
                </div>
              </div>
            )}
          </div>
          {vt.caption ? (
            <p className="mt-4 text-center text-sm text-ink-muted">{vt.caption}</p>
          ) : null}
        </div>
      </section>

      {/* Tour stops */}
      {vt.stops.length ? (
        <section className="bg-paper-dark py-24">
          <div className="container-page">
            <SectionHeading eyebrow={vt.stopsHeading.eyebrow} title={vt.stopsHeading.title} />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vt.stops.map((s) => (
                <div key={s.title} className="group relative aspect-[4/3] overflow-hidden rounded-2xl text-left">
                  <div className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${s.image}')` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/85 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5 text-white">
                    <h3 className="text-lg !text-white">{s.title}</h3>
                    <span className="text-gold-300"><Icon name="arrow-up-right" size={20} /></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* CTA */}
      {vt.cta.title ? (
        <section className="py-24">
          <div className="container-page text-center">
            <SectionHeading align="center" eyebrow={vt.cta.eyebrow} title={vt.cta.title} />
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {vt.cta.primary.label ? <Button href={vt.cta.primary.href} size="lg" icon="arrow-right">{vt.cta.primary.label}</Button> : null}
              {vt.cta.secondary.label ? <Button href={vt.cta.secondary.href} variant="outline" size="lg">{vt.cta.secondary.label}</Button> : null}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
