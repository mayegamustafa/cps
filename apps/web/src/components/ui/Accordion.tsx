'use client';

import { useState } from 'react';
import { Icon } from '@/components/Icon';

export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-paper">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-display text-lg text-maroon-900">{item.q}</span>
                <Icon
                  name="chevron-down"
                  size={20}
                  className={`shrink-0 text-maroon-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </h3>
            {isOpen ? (
              <div className="px-6 pb-5 text-ink-soft">{item.a}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
