'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';

/**
 * Shows a print-ready document on screen and prints it on demand.
 *
 * The document is a complete HTML page with its own @page rules, so it is put in
 * an iframe rather than injected into this one: that keeps its print styling
 * intact and stops the site's own CSS from leaking into it. Printing targets the
 * iframe, so the surrounding page furniture never reaches the paper.
 */
export function PrintableDocument({
  title,
  intro,
  html,
  backHref,
  backLabel,
  altHref,
  altLabel,
}: {
  title: string;
  intro: string;
  html: string;
  backHref: string;
  backLabel: string;
  altHref?: string;
  altLabel?: string;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  function print() {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
  }

  return (
    <section className="section">
      <div className="container-page">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon-700 hover:text-maroon-800"
        >
          <Icon name="chevron-right" size={16} className="rotate-180" />
          {backLabel}
        </Link>

        <h1 className="mt-4 text-3xl sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">{intro}</p>

        <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
          <Button onClick={print} size="lg" icon="download">Print / Save as PDF</Button>
          {altHref && altLabel ? (
            <Button href={altHref} variant="outline" size="lg" icon="arrow-right">{altLabel}</Button>
          ) : null}
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
          <iframe
            ref={frameRef}
            title={title}
            srcDoc={html}
            className="h-[70vh] w-full min-h-[520px]"
          />
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          The preview above is the exact page that prints. On a phone, use Print and then
          choose &ldquo;Save as PDF&rdquo; to keep a copy.
        </p>
      </div>
    </section>
  );
}
