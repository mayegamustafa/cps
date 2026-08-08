'use client';

import { useState, type ReactNode } from 'react';
import { Icon } from '@/components/Icon';

type Props = {
  children: ReactNode;
  /** Lines shown before the fold on mobile. Desktop always shows everything. */
  lines?: number;
  className?: string;
  tone?: 'light' | 'dark';
};

/**
 * Trims a long paragraph on phones with an inline expand.
 *
 * Deliberately not a modal or a link to another page: the full text stays in the
 * DOM for search engines and assistive tech, and a parent who wants to read on
 * does it in place without losing their scroll position.
 */
export function ReadMore({ children, lines = 4, className = '', tone = 'light' }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div
        className={open ? className : `clamp-mobile ${className}`}
        style={open ? undefined : { WebkitLineClamp: lines }}
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold sm:hidden ${
          tone === 'dark' ? 'text-gold-300' : 'text-maroon-700'
        }`}
      >
        {open ? 'Show less' : 'Read more'}
        <Icon
          name="chevron-down"
          size={16}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  );
}
