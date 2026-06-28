'use client';

import { Icon, type IconName } from '@/components/Icon';
import type { SocialPostCard } from '@/lib/public-data';

const NETWORK_LABEL: Record<string, string> = {
  youtube: 'YouTube', instagram: 'Instagram', facebook: 'Facebook',
  tiktok: 'TikTok', linkedin: 'LinkedIn', x: 'X',
};

function Card({ p }: { p: SocialPostCard }) {
  return (
    <a
      href={p.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group/card block w-72 shrink-0 overflow-hidden rounded-2xl border border-line bg-paper transition-all hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-square overflow-hidden bg-maroon-900">
        {p.thumbnailUrl ? (
          <div className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover/card:scale-105" style={{ backgroundImage: `url('${p.thumbnailUrl}')` }} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-maroon-800 to-maroon-950 text-gold-300">
            <Icon name={(p.network as IconName) ?? 'instagram'} size={36} />
          </div>
        )}
        {p.isVideo ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/85 text-maroon-800 shadow-soft">
              <Icon name="play" size={22} />
            </span>
          </span>
        ) : null}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-maroon-950/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
          <Icon name={(p.network as IconName) ?? 'instagram'} size={13} /> {NETWORK_LABEL[p.network] ?? p.network}
        </span>
      </div>
      {p.caption ? (
        <p className="line-clamp-2 px-4 py-3 text-sm text-ink-soft">{p.caption}</p>
      ) : null}
    </a>
  );
}

/** Auto-scrolling social wall. The track is duplicated for a seamless loop and
 *  pauses on hover; reduced-motion users see a static, scrollable row. */
export function SocialWall({ posts }: { posts: SocialPostCard[] }) {
  if (!posts.length) return null;
  const track = [...posts, ...posts];
  return (
    <div className="group relative overflow-hidden" aria-label="Social media posts">
      {/* Soft edge fades */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-paper to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-paper to-transparent" />
      <div className="flex w-max gap-5 px-6 animate-marquee group-hover:[animation-play-state:paused]">
        {track.map((p, i) => (
          <Card key={`${p.id}-${i}`} p={p} />
        ))}
      </div>
    </div>
  );
}
