import type { Metadata } from 'next';
import { assertPageEnabled } from '@/lib/page-guard';
import { ConfigurablePageHero } from '@/components/ui/ConfigurablePageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { getSiteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Talent Development Program',
  description:
    'The City Parents School Talent Development Program — nurturing pupils’ gifts in music, sport, the arts, debate, science and more, with photos and videos.',
};

function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  if (/^[\w-]{11}$/.test(url)) return `https://www.youtube.com/embed/${url}`;
  return null;
}

export default async function TalentPage() {
  await assertPageEnabled('talent');
  const { talent } = await getSiteConfig();
  const { intro, areas, media, cta } = talent;

  return (
    <>
      <ConfigurablePageHero page="talent"
        eyebrow="Talent Development Program"
        title="Where every talent finds its stage."
        intro="Discover how we nurture each child’s gifts — in music, sport, the arts, debate, science and more."
        crumbs={[{ label: 'Talent' }]}
        image="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=2000&q=70"
      />

      {/* Intro */}
      <section className="py-24">
        <div className="container-page max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">{intro.eyebrow}</span>
          <h2 className="mt-3 font-display text-3xl text-maroon-900 sm:text-4xl">{intro.title}</h2>
          {intro.body ? <p className="mt-5 text-lg leading-relaxed text-ink-soft">{intro.body}</p> : null}
        </div>
      </section>

      {/* Talent areas */}
      {areas.length ? (
        <section className="bg-paper-dark py-24">
          <div className="container-page">
            <SectionHeading align="center" eyebrow="What we develop" title="Talent areas" />
            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {areas.map((a) => (
                <div key={a.title} className="rounded-2xl border border-line bg-paper p-7">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-maroon-700 text-gold-300">
                    <Icon name={a.icon} size={24} />
                  </span>
                  <h3 className="mt-5 text-xl">{a.title}</h3>
                  <p className="mt-2 text-sm text-ink-soft">{a.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Media showcase */}
      <section className="py-24">
        <div className="container-page">
          <SectionHeading eyebrow="In action" title="Talent in pictures & film" intro="Moments from rehearsals, matches, performances and showcases across the programme." />
          {media.length === 0 ? (
            <p className="mt-10 rounded-2xl border border-line bg-paper-dark/40 p-10 text-center text-ink-muted">
              Media is being added — check back soon for photos and videos from the programme.
            </p>
          ) : (
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {media.map((m, i) => {
                const embed = m.type === 'video' ? youtubeEmbed(m.url) : null;
                return (
                  <figure key={i} className="overflow-hidden rounded-2xl border border-line bg-paper">
                    <div className="relative aspect-video bg-maroon-950">
                      {m.type === 'video' ? (
                        embed ? (
                          <iframe
                            src={embed}
                            title={m.title || `Talent video ${i + 1}`}
                            className="absolute inset-0 h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                          />
                        ) : (
                          // eslint-disable-next-line jsx-a11y/media-has-caption
                          <video src={m.url} controls playsInline className="absolute inset-0 h-full w-full object-cover" />
                        )
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt={m.title || 'Talent showcase'} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                      )}
                    </div>
                    {(m.title || m.description) ? (
                      <figcaption className="p-5">
                        {m.title ? <h3 className="text-lg leading-snug">{m.title}</h3> : null}
                        {m.description ? <p className="mt-1 text-sm text-ink-soft">{m.description}</p> : null}
                      </figcaption>
                    ) : null}
                  </figure>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      {cta.label ? (
        <section className="pb-24">
          <div className="container-page">
            <div className="rounded-3xl bg-maroon-900 px-8 py-14 text-center text-white sm:px-16">
              <h2 className="font-display text-3xl !text-white">Discover your child’s potential</h2>
              <p className="mx-auto mt-3 max-w-xl text-paper/80">Talk to us about joining the Talent Development Program.</p>
              <div className="mt-7">
                <Button href={cta.href} variant="gold" size="lg" icon="arrow-right">{cta.label}</Button>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
