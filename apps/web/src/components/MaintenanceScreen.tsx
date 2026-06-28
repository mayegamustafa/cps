'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Icon, type IconName } from '@/components/Icon';
import type { SiteConfig } from '@/lib/site';

function useCountdown(target?: string) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!target) return;
    const end = new Date(target).getTime();
    if (Number.isNaN(end)) return;
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [target]);
  return left;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export function MaintenanceScreen({ config }: { config: SiteConfig }) {
  const left = useCountdown(config.maintenance.returnAt);
  const { brand, contact, social } = config;

  const parts = left != null ? {
    d: Math.floor(left / 86400000),
    h: Math.floor((left % 86400000) / 3600000),
    m: Math.floor((left % 3600000) / 60000),
    s: Math.floor((left % 60000) / 1000),
  } : null;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-maroon-950 px-6 py-16 text-center text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-maroon-900/40 via-maroon-950 to-maroon-950" />
      <div className="w-full max-w-xl">
        <span className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white/10 ring-1 ring-white/15">
          <Image src={brand.logoLightUrl || brand.logoUrl} alt={brand.name} width={64} height={64} className="h-14 w-14 object-contain" unoptimized />
        </span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-gold-300">{brand.name}</p>
        <h1 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">We&rsquo;ll be back shortly</h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-paper/75">{config.maintenance.message}</p>

        {parts ? (
          <div className="mt-8 inline-flex items-center gap-3">
            {[{ v: parts.d, l: 'Days' }, { v: parts.h, l: 'Hrs' }, { v: parts.m, l: 'Min' }, { v: parts.s, l: 'Sec' }].map((b) => (
              <div key={b.l} className="w-16 rounded-xl border border-white/10 bg-white/5 py-3 backdrop-blur">
                <div className="font-display text-2xl text-gold-300">{pad(b.v)}</div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wide text-paper/60">{b.l}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-10 flex flex-col items-center gap-2 text-sm text-paper/75">
          {contact.phone ? (
            <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-2 hover:text-white"><Icon name="phone" size={16} className="text-gold-300" /> {contact.phone}</a>
          ) : null}
          {contact.email ? (
            <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 hover:text-white"><Icon name="mail" size={16} className="text-gold-300" /> {contact.email}</a>
          ) : null}
        </div>

        {social?.length ? (
          <div className="mt-6 flex justify-center gap-2">
            {social.filter((s) => s.href).map((s) => (
              <a key={s.network} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="rounded-full border border-white/15 p-2.5 text-paper/70 transition-colors hover:border-gold-300 hover:text-gold-300">
                <Icon name={s.network as IconName} size={18} />
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
