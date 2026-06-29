'use client';

import { useEffect } from 'react';

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
    <div className="rounded-2xl border border-line bg-paper p-5">
      <h3 className="mb-4 text-lg">{title}</h3>
      {children}
    </div>
  );
}

/** Live social platform embeds: TikTok creator feed, Facebook page plugin and
 *  a YouTube player. Each renders only when configured in admin. */
export function SocialFeeds({ feeds }: { feeds: Feeds }) {
  const tk = tiktokUser(feeds.tiktok);
  const fb = fbPlugin(feeds.facebook);
  const yt = ytEmbed(feeds.youtube);

  // Load (and re-scan with) the TikTok embed script when a username is set.
  useEffect(() => {
    if (!tk) return;
    const s = document.createElement('script');
    s.src = 'https://www.tiktok.com/embed.js';
    s.async = true;
    document.body.appendChild(s);
    return () => { try { document.body.removeChild(s); } catch { /* already gone */ } };
  }, [tk]);

  if (!tk && !fb && !yt) return null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
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
