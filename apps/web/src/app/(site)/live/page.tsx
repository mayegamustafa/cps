import type { Metadata } from 'next';
import { PageHero } from '@/components/ui/PageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Icon } from '@/components/Icon';
import { recordings, events } from '@/lib/content';
import { serverApi } from '@/lib/api-base';

export const metadata: Metadata = {
  title: 'Live TV',
  description:
    'Watch City Parents School events live, assemblies, sports, graduation and more, and revisit past recordings.',
};

type ActiveStream = {
  slug: string;
  title: string;
  provider: string;
  embedUrl?: string | null;
  hlsUrl?: string | null;
} | null;

// The currently-live stream from the API (null when nothing is live / API down).
async function getActiveStream(): Promise<ActiveStream> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null;
  const API = serverApi();
  try {
    const res = await fetch(`${API}/api/live/active`, {
      next: { revalidate: 15 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as ActiveStream;
  } catch {
    return null;
  }
}

function autoplaySrc(url: string) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}autoplay=1&mute=1`;
}

export default async function LivePage() {
  const live = await getActiveStream();

  return (
    <>
      <PageHero
        eyebrow="City Parents Live"
        title="Be there, wherever you are."
        intro="Our school-owned streaming platform brings assemblies, sports days, graduations and special events directly to your screen, live and on demand."
        crumbs={[{ label: 'Live TV' }]}
      />

      {/* Player + chat */}
      <section className="py-16">
        <div className="container-page grid gap-6 lg:grid-cols-[2.2fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-line bg-maroon-950">
            <div className="relative aspect-video">
              {live?.embedUrl ? (
                <iframe
                  src={autoplaySrc(live.embedUrl)}
                  title={live.title}
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : live?.hlsUrl ? (
                <video
                  className="absolute inset-0 h-full w-full bg-black"
                  autoPlay
                  muted
                  controls
                  playsInline
                  src={live.hlsUrl}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-gold-300">
                      <Icon name="play" size={30} />
                    </span>
                    <p className="mt-4 font-display text-xl text-white">No live event right now</p>
                    <p className="mt-1 text-sm text-paper/60">Check the schedule below for upcoming broadcasts.</p>
                  </div>
                </div>
              )}
              {live ? (
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-maroon-700 px-3 py-1.5 text-xs font-semibold text-white">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-400" />
                  </span>
                  LIVE
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-5 text-white">
              <div>
                <h2 className="text-xl !text-white">{live ? live.title : 'Nothing live at the moment'}</h2>
                <p className="text-sm text-paper/60">{live ? 'Streaming now' : 'Upcoming events are listed below'}</p>
              </div>
            </div>
          </div>

          {/* Live chat */}
          <div className="flex h-full flex-col rounded-2xl border border-line bg-paper">
            <div className="border-b border-line p-4">
              <h3 className="text-lg">Live chat</h3>
            </div>
            <ul className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
              {[
                { n: 'Grace M.', m: 'So proud of the choir today!' },
                { n: 'Admin', m: 'Welcome everyone, assembly begins shortly.' },
                { n: 'Peter O.', m: 'Watching from London. Beautiful!' },
                { n: 'Sarah N.', m: 'The new hall looks wonderful.' },
              ].map((c, i) => (
                <li key={i}>
                  <span className="font-semibold text-maroon-800">{c.n}</span>
                  <p className="text-ink-soft">{c.m}</p>
                </li>
              ))}
            </ul>
            <div className="border-t border-line p-3">
              <input
                placeholder="Say something…"
                className="w-full rounded-full border border-line bg-white px-4 py-2.5 text-sm focus:border-maroon-500 focus:outline-none focus:ring-2 focus:ring-maroon-500/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming streams */}
      <section className="bg-paper-dark py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Scheduled" title="Upcoming live broadcasts" />
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {events.slice(0, 4).map((e) => (
              <div key={e.title} className="flex items-center gap-4 rounded-2xl border border-line bg-paper p-5">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-maroon-700 text-gold-300">
                  <Icon name="calendar" size={22} />
                </span>
                <div className="flex-1">
                  <h3 className="text-lg">{e.title}</h3>
                  <p className="text-sm text-ink-muted">
                    {new Date(e.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · {e.time}
                  </p>
                </div>
                <button className="rounded-full border border-maroon-700/30 px-4 py-2 text-sm font-medium text-maroon-800 hover:bg-maroon-50">
                  Remind me
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Archive */}
      <section className="py-24">
        <div className="container-page">
          <SectionHeading eyebrow="On demand" title="Recording archive" intro="Missed an event? Catch up any time from our searchable archive of past broadcasts." />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {recordings.map((r) => (
              <div key={r.title} className="overflow-hidden rounded-2xl border border-line bg-paper">
                <div className="relative flex aspect-video items-center justify-center bg-maroon-900">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold-400 text-maroon-900">
                    <Icon name="play" size={24} />
                  </span>
                  <span className="absolute bottom-3 right-3 rounded bg-maroon-950/80 px-2 py-0.5 text-xs text-white">{r.duration}</span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg">{r.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{r.date} · {r.views} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
