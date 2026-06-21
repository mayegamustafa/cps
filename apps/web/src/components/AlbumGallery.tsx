'use client';

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';

/** Photo grid with a full-screen lightbox (keyboard + swipe-friendly nav). */
export function AlbumGallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const prev = useCallback(
    () => setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length)),
    [images.length],
  );
  const next = useCallback(
    () => setOpen((i) => (i === null ? i : (i + 1) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (open === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, close, prev, next]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={`Open photo ${i + 1}`}
            className="group relative aspect-square overflow-hidden rounded-xl"
          >
            <div
              className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url('${src}')` }}
            />
            <span className="absolute inset-0 bg-maroon-950/0 transition-colors group-hover:bg-maroon-950/20" />
          </button>
        ))}
      </div>

      {open !== null ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — photo viewer`}
        >
          <button
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <Icon name="close" size={24} />
          </button>

          {images.length > 1 ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Previous"
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <Icon name="arrow-right" size={24} className="rotate-180" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Next"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <Icon name="arrow-right" size={24} />
              </button>
            </>
          ) : null}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[open]}
            alt={`${title} — photo ${open + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
            {open + 1} / {images.length}
          </span>
        </div>
      ) : null}
    </>
  );
}
