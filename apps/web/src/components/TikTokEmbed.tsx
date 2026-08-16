'use client';

import { useEffect } from 'react';
import { Icon } from '@/components/Icon';

/**
 * A single TikTok video.
 *
 * TikTok serves its embed page with `frame-ancestors https://www.tiktok.com`,
 * so pointing an iframe straight at tiktok.com/embed/v2/<id> is refused by the
 * browser: "www.tiktok.com refused to connect". Their supported route is this
 * blockquote plus embed.js, which swaps it for a player TikTok itself allows.
 *
 * The blockquote also degrades honestly: before the script runs, and if it never
 * does, what remains is a working link to the video.
 */
export function TikTokEmbed({ videoId, url }: { videoId: string; url: string }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      try { document.body.removeChild(script); } catch { /* already gone */ }
    };
  }, [videoId]);

  return (
    <div className="flex justify-center bg-paper py-4">
      <blockquote
        className="tiktok-embed"
        cite={url}
        data-video-id={videoId}
        style={{ maxWidth: '100%', minWidth: 280, margin: 0 }}
      >
        <section>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-maroon-700"
          >
            <Icon name="tiktok" size={18} /> Watch this tour on TikTok
          </a>
        </section>
      </blockquote>
    </div>
  );
}
