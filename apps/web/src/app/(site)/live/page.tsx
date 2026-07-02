import type { Metadata } from 'next';
import { assertPageEnabled } from '@/lib/page-guard';
import { ConfigurablePageHero } from '@/components/ui/ConfigurablePageHero';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { getSiteConfig } from '@/lib/site-config';
import { serverApi } from '@/lib/api-base';

export const metadata: Metadata = {
  title: 'Live TV',
  description:
    'City Parents School Live TV — assemblies, sports, graduations and special events, streamed to families wherever they are.',
};

type ActiveStream = { title: string; description?: string | null; embedUrl?: string | null } | null;
type Recording = { slug: string; title: string; recordingUrl?: string | null; thumbnailUrl?: string | null };

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return fallback;
  try {
    const res = await fetch(`${serverApi()}${path}`, { next: { revalidate: 20 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export default async function LivePage() {
  await assertPageEnabled('live');
  const { live } = await getSiteConfig();
  const active = await fetchJson<ActiveStream>('/api/live/active', null);
  const recordings = await fetchJson<Recording[]>('/api/live', []);

  return (
    <>
      <ConfigurablePageHero page="live"
        eyebrow="City Parents Live"
        title="Be there, wherever you are."
        intro="Our school streaming platform brings assemblies, sports days, graduations and special events directly to your screen — live and on demand."
        crumbs={[{ label: 'Live TV' }]}
      />

      <section className="py-24">
        <div className="container-page">
          {active && active.embedUrl ? (
            /* A stream is live now */
            <div className="mx-auto max-w-4xl">
              <div className="mb-5 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-maroon-700">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-maroon-600 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-maroon-600" />
                </span>
                Live now
              </div>
              <div className="overflow-hidden rounded-2xl border border-line bg-maroon-950">
                <iframe
                  src={active.embedUrl}
                  title={active.title}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>
              <h2 className="mt-6 text-2xl">{active.title}</h2>
              {active.description ? <p className="mt-2 text-ink-soft">{active.description}</p> : null}
            </div>
          ) : (
            /* Nothing live — editable "coming soon" card */
            <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-line bg-maroon-950 px-8 py-16 text-center text-white sm:px-16">
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-maroon-900/50 to-maroon-950" />
              <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-gold-300 ring-1 ring-white/15">
                <Icon name="video" size={30} />
              </span>
              {live.badge ? <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-gold-300">{live.badge}</p> : null}
              <h2 className="mt-3 font-display text-3xl !text-white sm:text-4xl">{live.title}</h2>
              {live.message ? <p className="mx-auto mt-4 max-w-xl text-paper/75">{live.message}</p> : null}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {live.primary.label ? <Button href={live.primary.href} variant="gold" size="lg" icon="arrow-right">{live.primary.label}</Button> : null}
                {live.secondary.label ? (
                  <Button href={live.secondary.href} size="lg" className="border border-white/25 bg-transparent text-white hover:bg-white/10">
                    {live.secondary.label}
                  </Button>
                ) : null}
              </div>
            </div>
          )}

          {/* Recordings archive */}
          {recordings.length ? (
            <div className="mt-20">
              <h2 className="flex items-center gap-3 text-2xl"><span className="h-px w-8 bg-gold-400" /> Recent recordings</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recordings.map((r) => (
                  <a
                    key={r.slug}
                    href={r.recordingUrl ?? `/live/${r.slug}`}
                    className="group overflow-hidden rounded-2xl border border-line bg-paper transition-all hover:-translate-y-1 hover:shadow-lift"
                  >
                    <div
                      className="aspect-video bg-maroon-950 bg-cover bg-center"
                      style={r.thumbnailUrl ? { backgroundImage: `url('${r.thumbnailUrl}')` } : undefined}
                    />
                    <div className="flex items-center justify-between gap-2 p-5">
                      <h3 className="text-base font-medium group-hover:text-maroon-700">{r.title}</h3>
                      <span className="text-maroon-600"><Icon name="play" size={18} /></span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
