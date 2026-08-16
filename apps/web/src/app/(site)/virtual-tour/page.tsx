import type { Metadata } from 'next';
import { ConfigurablePageHero } from '@/components/ui/ConfigurablePageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { getSiteConfig } from '@/lib/site-config';
import { img, video, videoPoster, mediaPoster } from '@/lib/media';
import { resolveVideoSource } from '@/lib/video-embed';

export const metadata: Metadata = {
  title: 'Campus Tour',
  description:
    'A short film through the City Parents School campus: classrooms, laboratories, library and grounds.',
};

export default async function VirtualTourPage() {
  const { virtualTour: vt } = await getSiteConfig();
  // An uploaded file, or any video link pasted into the same field.
  const source = resolveVideoSource(vt.videoUrl);

  return (
    <>
      <ConfigurablePageHero page="virtual-tour"
        eyebrow="Campus Tour"
        title="See the school for yourself."
        intro="A short film through our classrooms, laboratories, library and grounds, so you know the place before you visit."
        crumbs={[{ label: 'Campus Tour' }]}
      />

      {/* Viewer: the uploaded tour video, or a poster placeholder until one is set. */}
      <section className="section-tight">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-maroon-950">
            {source.kind === 'file' ? (
              /* Starts on its own but muted, because every browser blocks
                 autoplay with sound. The native controls let a visitor unmute,
                 pause, scrub or go full screen. */
              <video
                src={video(source.src, 1280)}
                poster={vt.viewerImage ? img(vt.viewerImage, 1600) : videoPoster(source.src) || undefined}
                autoPlay
                muted
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full bg-black object-contain"
              />
            ) : source.kind === 'embed' ? (
              /* A link pasted from YouTube, Vimeo, TikTok and the like. Whether
                 it starts on its own is the platform's rule, not ours. */
              <iframe
                src={source.src}
                title={`Campus tour on ${source.provider}`}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <div
                className="flex aspect-video items-center justify-center bg-cover bg-center"
                style={{ backgroundImage: `url('${img(vt.viewerImage, 1600)}')` }}
              >
                <div className="flex flex-col items-center gap-3 rounded-2xl bg-maroon-950/40 px-8 py-6 text-center text-white backdrop-blur-sm sm:px-10 sm:py-8">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold-400 text-maroon-900 sm:h-16 sm:w-16">
                    <Icon name="play" size={28} />
                  </span>
                  <span className="font-display text-lg sm:text-xl">Tour coming soon</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tour stops */}
      {vt.stops.length ? (
        <section className="section bg-paper-dark">
          <div className="container-page">
            <SectionHeading eyebrow={vt.stopsHeading.eyebrow} title={vt.stopsHeading.title} />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vt.stops.map((s) => (
                <div key={s.title} className="group relative aspect-[4/3] overflow-hidden rounded-2xl text-left">
                  <div className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${mediaPoster(s.image, 900)}')` }} />
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
        <section className="section">
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
