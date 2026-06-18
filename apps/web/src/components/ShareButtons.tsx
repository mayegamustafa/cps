'use client';

import { useState } from 'react';
import { Icon, type IconName } from '@/components/Icon';

/**
 * Permanent shareable links with native share + per-platform deep links.
 * `path` is the canonical path (e.g. /news/foo); the full URL is resolved at
 * click time so it works in any environment.
 */
export function ShareButtons({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);

  function fullUrl() {
    if (typeof window !== 'undefined') return new URL(path, window.location.origin).toString();
    return `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}${path}`;
  }

  const targets: { label: string; icon: IconName; build: (u: string, t: string) => string }[] = [
    { label: 'WhatsApp', icon: 'whatsapp', build: (u, t) => `https://wa.me/?text=${encodeURIComponent(`${t} ${u}`)}` },
    { label: 'Facebook', icon: 'facebook', build: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
    { label: 'X', icon: 'x', build: (u, t) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
    { label: 'Telegram', icon: 'telegram', build: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: fullUrl() });
      } catch {
        /* cancelled */
      }
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
        <Icon name="share" size={16} /> Share
      </span>
      {targets.map((t) => (
        <a
          key={t.label}
          href={t.build(fullUrl(), title)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${t.label}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-maroon-700/40 hover:bg-maroon-50 hover:text-maroon-700"
        >
          <Icon name={t.icon} size={17} />
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-label="Copy link"
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-maroon-700/40 hover:bg-maroon-50 hover:text-maroon-700"
      >
        <Icon name="link" size={16} /> {copied ? 'Copied' : 'Copy link'}
      </button>
      <button
        type="button"
        onClick={nativeShare}
        aria-label="Share via device"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-maroon-700/40 hover:bg-maroon-50 hover:text-maroon-700 sm:hidden"
      >
        <Icon name="share" size={17} />
      </button>
    </div>
  );
}
