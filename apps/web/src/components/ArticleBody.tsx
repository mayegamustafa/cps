'use client';

import { useEffect, useRef } from 'react';
import { Icon } from '@/components/Icon';
import { resolveSocialEmbed, type SocialEmbed } from '@/lib/social-embed';

/**
 * Renders an article written in the admin editor.
 *
 * The body is HTML, already stripped of scripts and handlers by the API before
 * it was stored. Social posts are kept in it as empty `<div data-embed="url">`
 * markers rather than as raw platform markup, so nothing in the stored article
 * depends on a third party's script tag surviving sanitising. The markers are
 * swapped for real embeds here, at read time.
 */
export function ArticleBody({ html }: { html: string }) {
  // Splitting on the marker keeps the surrounding prose as single HTML chunks,
  // so the article still renders as one flow rather than a list of paragraphs.
  const parts = html.split(/(<div[^>]*\sdata-embed="[^"]*"[^>]*>\s*<\/div>)/i);

  return (
    <>
      {parts.map((part, i) => {
        const marker = part.match(/data-embed="([^"]*)"/i);
        if (marker) return <EmbeddedPost key={i} url={decodeEntities(marker[1])} />;
        if (!part.trim()) return null;
        return <div key={i} dangerouslySetInnerHTML={{ __html: part }} />;
      })}
    </>
  );
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function EmbeddedPost({ url }: { url: string }) {
  const embed = resolveSocialEmbed(url);

  if (embed.kind === 'iframe') {
    return (
      <figure className="my-7">
        <iframe
          src={embed.src}
          title={embed.title}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full rounded-xl border border-line bg-paper-dark"
          style={{ aspectRatio: embed.aspect }}
        />
      </figure>
    );
  }

  if (embed.kind === 'script') return <ScriptEmbed embed={embed} />;

  return (
    <p className="my-6">
      <a
        href={embed.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-4 py-3 text-base no-underline hover:border-maroon-300"
      >
        <Icon name="link" size={16} />
        <span className="break-all">{embed.url}</span>
      </a>
    </p>
  );
}

const SCRIPTS: Record<string, string> = {
  twitter: 'https://platform.twitter.com/widgets.js',
  instagram: 'https://www.instagram.com/embed.js',
  tiktok: 'https://www.tiktok.com/embed.js',
};

/**
 * X, Instagram and TikTok each replace their own blockquote once their script
 * loads. The script is added once per page: loading it again per post would
 * re-run the whole widget pass for every embed in a long article.
 */
function ScriptEmbed({ embed }: { embed: Extract<SocialEmbed, { kind: 'script' }> }) {
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const src = SCRIPTS[embed.provider];
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);

    if (existing) {
      // Already loaded: ask the widget library to pick up this new blockquote.
      const w = window as unknown as {
        twttr?: { widgets?: { load: (el?: HTMLElement) => void } };
        instgrm?: { Embeds?: { process: () => void } };
      };
      w.twttr?.widgets?.load(holder.current ?? undefined);
      w.instgrm?.Embeds?.process();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    document.body.appendChild(script);
  }, [embed.provider, embed.url]);

  return (
    <div ref={holder} className="my-7 flex justify-center [&_blockquote]:!my-0 [&_blockquote]:!border-0 [&_blockquote]:!not-italic [&_blockquote]:!pl-0">
      {embed.provider === 'twitter' ? (
        <blockquote className="twitter-tweet">
          <a href={embed.url}>{embed.url}</a>
        </blockquote>
      ) : embed.provider === 'instagram' ? (
        <blockquote
          className="instagram-media w-full"
          data-instgrm-permalink={embed.url}
          data-instgrm-version="14"
        >
          <a href={embed.url}>{embed.url}</a>
        </blockquote>
      ) : (
        <blockquote className="tiktok-embed" cite={embed.url} data-video-id={embed.id}>
          <section>
            <a href={embed.url}>{embed.url}</a>
          </section>
        </blockquote>
      )}
    </div>
  );
}
