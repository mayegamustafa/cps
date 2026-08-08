'use client';

import { useEffect, useState } from 'react';
import { imgProps, video as videoUrl } from '@/lib/media';

type Props = {
  /** Cloudinary (or any) video URL. When empty, only the still is rendered. */
  src: string;
  /** Still frame used as the first paint, the poster, and the low-data fallback. */
  poster: string;
  alt: string;
};

/**
 * Hero background.
 *
 * The still is always rendered first so it can be the LCP element — a properly
 * sized AVIF instead of a multi-megabyte original. The video is only attached
 * afterwards, and never on a metered or slow connection, because the previous
 * behaviour (`preload="auto"` on the untransformed source) started a large
 * download before a parent on mobile data had read a single word.
 */
export function HeroMedia({ src, poster, alt }: Props) {
  const [videoSrc, setVideoSrc] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!src) return;
    const conn = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;

    if (conn?.saveData) return;
    if (conn?.effectiveType && /2g/.test(conn.effectiveType)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Phones get a 720px-wide re-encode; only desktops pull the larger rendition.
    const width = window.matchMedia('(min-width: 1024px)').matches ? 1440 : 720;
    // Let the still paint and the page settle before competing for bandwidth.
    const timer = window.setTimeout(() => setVideoSrc(videoUrl(src, width)), 600);
    return () => window.clearTimeout(timer);
  }, [src]);

  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden bg-maroon-950">
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          {...imgProps(poster, '100vw')}
          alt={alt}
          fetchPriority="high"
          decoding="sync"
          className="h-full w-full scale-[1.02] object-cover"
        />
      ) : null}

      {videoSrc ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={() => setReady(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src={videoSrc} />
        </video>
      ) : null}
    </div>
  );
}
