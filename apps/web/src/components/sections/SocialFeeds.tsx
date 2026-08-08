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

function fbPlugin(pageUrl: string): string {
  const v = pageUrl?.trim();
  if (!v) return '';
  const href = encodeURIComponent(v);
  return `https://www.facebook.com/plugins/page.php?href=${href}&tabs=timeline&width=400&height=520&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false`;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-paper p-5">
      <h3 className="mb-4 text-lg">{title}</h3>
      {children}
    </div>
  );
}

/** A compact, on-brand link tile — what phones get instead of a platform widget. */
function FollowTile({
  href,
  network,
  label,
  handle,
}: {
  href: string;
  network: IconName;
  label: string;
  handle: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-2xl border border-line bg-paper p-4 transition-colors hover:border-maroon-700/40 hover:bg-maroon-50"
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-maroon-700 text-gold-300">
        <Icon name={network} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block truncate text-xs text-ink-muted">{handle}</span>
      </span>
      <Icon name="arrow-up-right" size={18} className="shrink-0 text-maroon-700" />
    </a>
  );
}

/** Live social platform embeds: TikTok creator feed, Facebook page plugin and
 *  a YouTube player. Each renders only when configured in admin. */
export function SocialFeeds({ feeds }: { feeds: Feeds }) {
  const tk = tiktokUser(feeds.tiktok);
  const fb = fbPlugin(feeds.facebook);
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

  return (
    <>
      {/*
        Phones get link tiles, not platform widgets.
        The TikTok creator embed renders a tall, often-blank box and the Facebook
        page plugin overflows its card below ~400px — between them they were the
        heaviest and least reliable part of the page on exactly the devices most
        visitors use. Tiles are instant, on-brand, and load no third-party code:
        the embeds live in a `hidden sm:block` wrapper, so the observer below
        never fires on a phone and the scripts are never requested.
      */}
      <div className="grid gap-3 sm:hidden">
        {tk ? (
          <FollowTile
            href={`https://www.tiktok.com/@${tk}`}
            network="tiktok"
            label="Follow us on TikTok"
            handle={`@${tk}`}
          />
        ) : null}
        {feeds.facebook ? (
          <FollowTile
            href={feeds.facebook}
            network="facebook"
            label="Follow us on Facebook"
            handle="Daily updates from campus"
          />
        ) : null}
        {yt ? (
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-line">
            <iframe
              title="YouTube"
              src={yt}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>
        ) : null}
      </div>

      <div className="hidden sm:block">{renderEmbeds()}</div>
    </>
  );

  function renderEmbeds() {
    // Reserve the height the embeds will occupy so nothing below them jumps.
    if (!near) {
      return <div ref={hostRef} aria-hidden className="min-h-[420px] rounded-2xl border border-line bg-paper-dark/40" />;
    }
    return (
    <div ref={hostRef} className="grid gap-6 md:grid-cols-2">
      {tk ? (
        <Card title="Our TikTok Feed">
          <div className="overflow-x-auto">
            <blockquote
              className="tiktok-embed"
              cite={`https://www.tiktok.com/@${tk}`}
              data-unique-id={tk}
              data-embed-type="creator"
              style={{ maxWidth: 780, minWidth: 288 }}
            >
              <section>
                <a href={`https://www.tiktok.com/@${tk}`} target="_blank" rel="noopener noreferrer">@{tk}</a>
              </section>
            </blockquote>
          </div>
        </Card>
      ) : null}

      {fb ? (
        <Card title="Our Facebook Page">
          <iframe
            title="Facebook page"
            src={fb}
            className="w-full rounded-xl"
            height={520}
            style={{ border: 'none', overflow: 'hidden' }}
            allow="encrypted-media; clipboard-write; web-share"
            loading="lazy"
          />
        </Card>
      ) : null}

      {yt ? (
        <div className="md:col-span-2">
          <Card title="Our YouTube Videos">
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
}
