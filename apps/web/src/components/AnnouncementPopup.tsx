'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/Icon';

type Announcement = {
  id: string;
  title?: string | null;
  message: string;
  category?: string | null;
  link?: string | null;
  linkLabel?: string | null;
  imageUrl?: string | null;
  eventDate?: string | null;
  popup?: boolean;
  audience?: string | null; // all | homepage | specific
  pages?: string[];
  device?: string | null; // all | mobile | desktop
  frequency?: string | null; // session | always
};

const CATEGORY: Record<string, { label: string; icon: IconName }> = {
  event: { label: 'Event', icon: 'calendar' },
  emergency: { label: 'Important Notice', icon: 'megaphone' },
  admission: { label: 'Admissions', icon: 'graduation-cap' },
  holiday: { label: 'Holiday Notice', icon: 'calendar' },
  maintenance: { label: 'Notice', icon: 'settings' },
  general: { label: 'Announcement', icon: 'megaphone' },
};

const DISMISS_KEY = 'cps_dismissed_popups';

function getDismissed(): string[] {
  try { return JSON.parse(sessionStorage.getItem(DISMISS_KEY) || '[]'); } catch { return []; }
}

/** Premium centered announcement modal with smart targeting (date range handled
 *  server-side; device / audience / frequency handled here). */
export function AnnouncementPopup() {
  const pathname = usePathname();
  const [list, setList] = useState<Announcement[]>([]);
  const [item, setItem] = useState<Announcement | null>(null);
  const [shown, setShown] = useState(false);

  // Fetch active pop-up announcements once.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/announcements');
        if (!res.ok) return;
        const data = (await res.json()) as Announcement[];
        setList(data.filter((a) => a.popup));
      } catch { /* ignore */ }
    })();
  }, []);

  // Re-evaluate eligibility on route change.
  useEffect(() => {
    if (!list.length || item || typeof window === 'undefined') return;
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;
    const dismissed = getDismissed();
    const eligible = list.find((a) => {
      if ((a.frequency ?? 'session') === 'session' && dismissed.includes(a.id)) return false;
      if (a.device === 'mobile' && !isMobile) return false;
      if (a.device === 'desktop' && isMobile) return false;
      if (a.audience === 'homepage' && pathname !== '/') return false;
      if (a.audience === 'specific' && !(a.pages ?? []).some((p) => p && pathname?.startsWith(p))) return false;
      return true;
    });
    if (eligible) {
      setItem(eligible);
      requestAnimationFrame(() => setShown(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, pathname]);

  // Escape to close + lock scroll while open.
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  function close() {
    setShown(false);
    if (item) {
      const next = Array.from(new Set([...getDismissed(), item.id]));
      try { sessionStorage.setItem(DISMISS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    }
    setTimeout(() => setItem(null), 250);
  }

  if (!item) return null;
  const cat = CATEGORY[item.category ?? 'general'] ?? CATEGORY.general;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title || cat.label}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      <div
        aria-hidden
        onClick={close}
        className={`absolute inset-0 bg-maroon-950/60 backdrop-blur-sm transition-opacity duration-300 ${shown ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        className={`relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-black/5 transition-all duration-300 ${shown ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'}`}
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink-soft shadow-soft backdrop-blur transition-colors hover:bg-white hover:text-maroon-700"
        >
          <Icon name="close" size={18} />
        </button>

        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
        ) : null}

        <div className="p-6 sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-maroon-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-maroon-700">
            <Icon name={cat.icon} size={13} /> {cat.label}
          </span>
          {item.title ? <h2 className="mt-4 font-display text-2xl leading-tight text-maroon-900">{item.title}</h2> : null}
          <p className={`${item.title ? 'mt-2' : 'mt-4'} leading-relaxed text-ink-soft`}>{item.message}</p>

          {item.eventDate ? (
            <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-paper-dark px-3 py-2 text-sm font-medium text-ink">
              <Icon name="calendar" size={16} className="text-maroon-600" />
              {new Date(item.eventDate).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {item.link ? (
              <Link href={item.link} onClick={close} className="inline-flex items-center gap-1.5 rounded-full bg-maroon-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-maroon-800">
                {item.linkLabel || 'Learn more'} <Icon name="arrow-right" size={16} />
              </Link>
            ) : null}
            <button onClick={close} className="text-sm font-medium text-ink-muted hover:text-maroon-700">Dismiss</button>
          </div>
        </div>
      </div>
    </div>
  );
}
