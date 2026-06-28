'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/Icon';

type Action = { label: string; sub: string; href: string; icon: IconName };

const ACTIONS: Action[] = [
  { label: 'Begin Application', sub: 'Start the online admission form', href: '/admissions', icon: 'graduation-cap' },
  { label: 'Track Application', sub: 'Check your application status', href: '/admissions#track', icon: 'shield-check' },
  { label: 'Download Prospectus', sub: 'Fees, programmes & requirements', href: '/downloads', icon: 'download' },
];

/**
 * Premium mobile admissions CTA: a sticky floating capsule that expands into an
 * elegant action card. Desktop uses the header CTA, so this is hidden on lg+.
 * SVG icons only — no emojis.
 */
export function ApplyNowFab() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Gentle entrance after first paint.
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Close on route change, Escape, and lock scroll while open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Hide on the admissions page itself (the form is already there).
  if (pathname?.startsWith('/admissions')) return null;

  return (
    <div className="lg:hidden">
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-maroon-950/40 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      {/* Expandable action card */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Admissions"
        aria-hidden={!open}
        className={`fixed inset-x-4 bottom-24 z-50 origin-bottom rounded-2xl border border-line bg-paper shadow-2xl transition-all duration-300 ${open ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-3 scale-95 opacity-0'}`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-600">Admissions 2026 / 2027</p>
            <p className="mt-0.5 font-display text-lg text-maroon-900">Join City Parents</p>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-2 text-ink-muted hover:bg-maroon-50 hover:text-maroon-700">
            <Icon name="close" size={20} />
          </button>
        </div>
        <ul className="p-2">
          {ACTIONS.map((a) => (
            <li key={a.href}>
              <Link
                href={a.href}
                onClick={() => setOpen(false)}
                className="group flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-maroon-50"
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-maroon-700 text-gold-300 transition-colors group-hover:bg-maroon-800">
                  <Icon name={a.icon} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{a.label}</span>
                  <span className="block truncate text-sm text-ink-muted">{a.sub}</span>
                </span>
                <Icon name="chevron-right" size={18} className="shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Floating capsule */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close admissions menu' : 'Open admissions menu'}
        className={`fixed bottom-5 right-4 z-50 inline-flex items-center gap-2.5 rounded-full bg-maroon-700 py-3.5 pl-5 pr-5 text-white shadow-lift ring-1 ring-white/10 transition-all duration-300 hover:bg-maroon-800 active:scale-95 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <span className={`absolute inline-flex h-full w-full rounded-full bg-gold-400/50 transition-opacity ${open ? 'opacity-0' : 'animate-ping'}`} />
          <Icon name={open ? 'close' : 'graduation-cap'} size={20} className="relative text-gold-300" />
        </span>
        <span className="text-sm font-semibold tracking-wide">{open ? 'Close' : 'Apply Now'}</span>
      </button>
    </div>
  );
}
