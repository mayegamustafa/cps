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
  const [display, setDisplay] = useState(num === null ? value : '0');
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (num === null) {
      setDisplay(value);
      return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDisplay(num.toLocaleString());
      return;
    }
    const el = ref.current;
    if (!el) return;
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

export function StatsBand({ stats }: { stats: SchoolStat[] }) {
  return (
    <section className="border-y border-line bg-paper-dark/40 py-14">
      <div className="container-page">
        <dl className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          {stats.map((s) => (
            <div key={s.id} className="text-center">
              <dt className="font-display text-3xl text-maroon-700 sm:text-4xl">
                <Counter value={s.value} />
              </dt>
              <dd className="mt-1.5 text-sm text-ink-soft">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
