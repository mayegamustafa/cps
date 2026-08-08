'use client';

import { useEffect, useRef, useState } from 'react';
import type { SchoolStat } from '@/lib/stats';

// Splits "2,400+" into { num: 2400, prefix: '', suffix: '+' } for counting.
function parseValue(value: string) {
  const match = value.match(/([^\d]*)([\d,]+)(.*)/);
  if (!match) return { prefix: '', num: null as number | null, suffix: value };
  return {
    prefix: match[1] ?? '',
    num: Number(match[2].replace(/,/g, '')),
    suffix: match[3] ?? '',
  };
}

function Counter({ value }: { value: string }) {
  const { prefix, num, suffix } = parseValue(value);
  // Start at the REAL number, not "0". The server has no idea where the band
  // will land in the viewport, so seeding the animation start meant the HTML
  // shipped "0 Modern classrooms" and anyone landing without JS — or mid-scroll
  // on a slow phone — read a school with zero of everything.
  const [display, setDisplay] = useState(num === null ? value : num.toLocaleString());
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (num === null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current;
    if (!el) return;

    // Only rewind to zero when the number is still below the fold; otherwise the
    // correct value is already on screen and must not flicker back down.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    setDisplay('0');

    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const duration = 1400;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(num * eased).toLocaleString());
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [num, value]);

  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/**
 * A slim ribbon of school numbers directly beneath the hero. It stays dark so it
 * reads as the foot of the hero rather than a second, competing stats section,
 * and it centres itself for any count from one stat to six.
 */
export function StatsBand({ stats }: { stats: SchoolStat[] }) {
  if (!stats.length) return null;
  return (
    <section className="section-tight bg-maroon-900 text-white">
      <div className="container-page">
        <dl className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-8 gap-y-6 sm:gap-x-14">
          {stats.map((s) => (
            <div key={s.id} className="min-w-[6.5rem] flex-1 basis-[6.5rem] text-center">
              <dt className="font-display text-3xl text-gold-300 sm:text-4xl">
                <Counter value={s.value} />
              </dt>
              <dd className="mt-1 text-xs leading-tight text-paper/75 sm:text-sm">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
