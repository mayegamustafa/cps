'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '@/components/Icon';

type Feeds = { heading: string; tiktok: string; facebook: string; youtube: string };

function ytEmbed(input: string): string {
  const v = input?.trim();
  if (!v) return '';
  const list = v.match(/[?&]list=([\w-]+)/);
  if (list) return `https://www.youtube.com/embed/videoseries?list=${list[1]}`;
  const m = v.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  if (/^[\w-]{11}$/.test(v)) return `https://www.youtube.com/embed/${v}`;
  return '';
}

function tiktokUser(input: string): string {
  const v = input?.trim();
  if (!v) return '';
  const m = v.match(/@([\w.]+)/);
  if (m) return m[1];
  return v.replace(/^@/, '');
}

/**
 * Measures the element the ref is attached to and re-measures on resize and
 * orientation change. Both platform widgets need a real pixel width — they
 * cannot be sized with CSS alone.
 */
function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(Math.round(el.getBoundingClientRect().width));
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width] as const;
}

function Card({
  title,
  href,
  linkLabel,
  network,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  network: IconName;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-paper p-3 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3 px-1 sm:mb-4 sm:px-0">
        <h3 className="flex items-center gap-2 text-base sm:text-lg">
          <span className="text-maroon-700"><Icon name={network} size={18} /></span>
          {title}
        </h3>
        {/* Always reachable, even if the platform's own widget fails to load. */}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-maroon-700 hover:text-maroon-800"
        >
          {linkLabel}
          <Icon name="arrow-up-right" size={14} />
        </a>
      </div>
      {children}
    </div>
  );
}

/**
 * The Facebook page plugin renders at whatever pixel width you ask it for and
 * then refuses to shrink, which is why it used to burst out of its card on a
 * phone: the URL hard-coded `width=400` on a ~340px container. Measuring the
 * container first and passing that width (inside Facebook's supported 180-500
 * range) is the only way to make it fit.
 */
function FacebookFeed({ pageUrl }: { pageUrl: string }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const w = Math.max(180, Math.min(500, Math.floor(width) || 340));
  const h = w < 380 ? 460 : 520;
  const src =
    `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(pageUrl)}` +
    `&tabs=timeline&width=${w}&height=${h}&small_header=true` +
    `&adapt_container_width=true&hide_cover=false&show_facepile=false`;

  return (
    <div ref={ref} className="overflow-hidden rounded-xl">
      {width ? (
        <iframe
          title="Facebook page"
          src={src}
          width={w}
          height={h}
          className="block"
          style={{ border: 'none', overflow: 'hidden' }}
          allow="encrypted-media; clipboard-write; web-share"
          loading="lazy"
        />
      ) : (
        <div style={{ height: h }} />
      )}
    </div>
  );
}

/**
 * TikTok's creator widget replaces this blockquote with an iframe sized from
 * the `max-width` it finds. It has a hard 288px floor, so on the narrowest
 * phones the card drops its padding rather than letting the widget overflow.
 */
function TikTokFeed({ user }: { user: string }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const maxWidth = Math.max(288, Math.min(780, Math.floor(width) || 320));

  return (
    <div ref={ref} className="overflow-hidden rounded-xl">
      <blockquote
        className="tiktok-embed"
        cite={`https://www.tiktok.com/@${user}`}
        data-unique-id={user}
        data-embed-type="creator"
        style={{ maxWidth, minWidth: 288, margin: 0 }}
      >
        <section>
          <a href={`https://www.tiktok.com/@${user}`} target="_blank" rel="noopener noreferrer">
            @{user}
          </a>
        </section>
      </blockquote>
    </div>
  );
}

/** Live social platform embeds: TikTok creator feed, Facebook page plugin and
 *  a YouTube player. Each renders only when configured in admin. */
export function SocialFeeds({ feeds }: { feeds: Feeds }) {
  const tk = tiktokUser(feeds.tiktok);
  const fb = feeds.facebook?.trim() ?? '';
  const yt = ytEmbed(feeds.youtube);
  const hostRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  /**
   * Hold every third-party embed until the reader is close to this section.
   *
   * TikTok's embed script, the Facebook page plugin and the YouTube player are
   * each heavier than the rest of the homepage combined. They sit near the
   * bottom of the page, so loading them on first paint spent a mobile visitor's
   * bandwidth on content they had not scrolled to yet.
   */
  useEffect(() => {
    const el = hostRef.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        setNear(true);
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  // Load (and re-scan with) the TikTok embed script when a username is set.
  useEffect(() => {
    if (!tk || !near) return;
    const s = document.createElement('script');
    s.src = 'https://www.tiktok.com/embed.js';
    s.async = true;
    document.body.appendChild(s);
    return () => { try { document.body.removeChild(s); } catch { /* already gone */ } };
  }, [tk, near]);

  if (!tk && !fb && !yt) return null;

  // Reserve roughly the height the embeds will occupy so nothing below jumps.
  if (!near) {
    return <div ref={hostRef} aria-hidden className="min-h-[480px] rounded-2xl border border-line bg-paper-dark/40" />;
  }

  return (
    <div ref={hostRef} className="grid gap-4 sm:gap-6 md:grid-cols-2">
      {tk ? (
        <Card
          title="Our TikTok Feed"
          network="tiktok"
          href={`https://www.tiktok.com/@${tk}`}
          linkLabel="Open TikTok"
        >
          <TikTokFeed user={tk} />
        </Card>
      ) : null}

      {fb ? (
        <Card
          title="Our Facebook Page"
          network="facebook"
          href={fb}
          linkLabel="Open Facebook"
        >
          <FacebookFeed pageUrl={fb} />
        </Card>
      ) : null}

      {yt ? (
        <div className="md:col-span-2">
          <Card
            title="Our YouTube Videos"
            network="youtube"
            href={feeds.youtube}
            linkLabel="Open YouTube"
          >
            <div className="relative aspect-video overflow-hidden rounded-xl">
              <iframe
                title="YouTube"
                src={yt}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
