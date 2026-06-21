'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icon';

type Announcement = {
  id: string;
  message: string;
  severity: string;
  link?: string | null;
  linkLabel?: string | null;
  imageUrl?: string | null;
  popup?: boolean;
};

const AUTO_DISMISS_MS = 8000;

/** Shows active "pop-up" announcements once per session, auto-dismissing. */
export function AnnouncementPopup() {
  const [item, setItem] = useState<Announcement | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    (async () => {
      try {
        const res = await fetch('/api/announcements');
        if (!res.ok) return;
        const list = (await res.json()) as Announcement[];
        const dismissed = JSON.parse(sessionStorage.getItem('cps_dismissed_popups') || '[]');
        const next = list.find((a) => a.popup && !dismissed.includes(a.id));
        if (next) {
          setItem(next);
          timer = setTimeout(close, AUTO_DISMISS_MS);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    setLeaving(true);
    setItem((cur) => {
      if (cur) {
        const dismissed = JSON.parse(sessionStorage.getItem('cps_dismissed_popups') || '[]');
        sessionStorage.setItem('cps_dismissed_popups', JSON.stringify([...dismissed, cur.id]));
      }
      return cur;
    });
    setTimeout(() => setItem(null), 300);
  }

  if (!item) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-[60] w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-line bg-white shadow-lift transition-all duration-300 ${
        leaving ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
      }`}
      role="status"
    >
      {item.imageUrl ? (
        <div className="aspect-[16/9] w-full bg-cover bg-center" style={{ backgroundImage: `url('${item.imageUrl}')` }} />
      ) : null}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-maroon-50 px-2.5 py-0.5 text-xs font-semibold text-maroon-700">
            <Icon name="megaphone" size={13} /> Announcement
          </span>
          <button onClick={close} aria-label="Dismiss" className="rounded-full p-1 text-ink-muted hover:bg-paper-dark">
            <Icon name="close" size={16} />
          </button>
        </div>
        <p className="mt-2 text-sm text-ink">{item.message}</p>
        {item.link ? (
          <Link
            href={item.link}
            onClick={close}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-maroon-700 px-4 py-2 text-sm font-medium text-white hover:bg-maroon-800"
          >
            {item.linkLabel || 'Learn more'} <Icon name="arrow-right" size={15} />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
