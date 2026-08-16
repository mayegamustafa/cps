'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { waLink } from '@/lib/site';

export type DownloadItem = {
  title: string;
  category: string;
  size: string;
  fileUrl?: string;
};

/**
 * Documents whose title we handle ourselves rather than serving a file.
 *
 * The seeded fileUrls point at media.cityparents.ac.ug, a host that does not
 * resolve, so every one of these links was a dead end. Matching on the title
 * keeps the list editable in admin: rename a document and it simply reverts to
 * a normal file link.
 */
const APPLICATION_FORM = 'admission application form';
const FEES = 'fees structure';

function isApplicationForm(title: string) {
  return title.trim().toLowerCase() === APPLICATION_FORM;
}
function isFees(title: string) {
  return title.trim().toLowerCase().startsWith(FEES);
}

function Card({
  title,
  meta,
  icon = 'book-open',
}: {
  title: string;
  meta: string;
  icon?: 'book-open' | 'phone';
}) {
  return (
    <>
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-maroon-700">
        <Icon name={icon} size={22} />
      </span>
      <div className="flex-1 text-left">
        <h3 className="text-base font-medium text-ink group-hover:text-maroon-700">{title}</h3>
        <p className="text-sm text-ink-muted">{meta}</p>
      </div>
      <span className="text-maroon-600"><Icon name="arrow-up-right" size={20} /></span>
    </>
  );
}

const cardCls =
  'group flex w-full items-center gap-4 rounded-2xl border border-line bg-paper p-5 transition-all hover:border-maroon-700/30 hover:shadow-soft';

export function DownloadsList({
  items,
  phone,
  whatsapp,
}: {
  items: DownloadItem[];
  phone: string;
  whatsapp: string;
}) {
  const [feesOpen, setFeesOpen] = useState(false);
  const categories = Array.from(new Set(items.map((d) => d.category)));

  return (
    <div className="space-y-12">
      {categories.map((cat) => (
        <div key={cat}>
          <h2 className="flex items-center gap-3 text-2xl">
            <span className="h-px w-8 bg-gold-400" /> {cat}
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {items
              .filter((d) => d.category === cat)
              .map((d) => (
                <li key={d.title}>
                  {isApplicationForm(d.title) ? (
                    // Generated from the live form rather than a stored PDF, so
                    // it can never drift out of step with the online version.
                    <Link href="/downloads/application-form" className={cardCls}>
                      <Card title={d.title} meta="Print or save as PDF" />
                    </Link>
                  ) : isFees(d.title) ? (
                    <button type="button" onClick={() => setFeesOpen(true)} className={cardCls}>
                      <Card title={d.title} meta="Call or WhatsApp us for the fee structure" icon="phone" />
                    </button>
                  ) : (
                    <a href={d.fileUrl ?? '#'} className={cardCls}>
                      <Card title={d.title} meta={`PDF · ${d.size}`} />
                    </a>
                  )}
                </li>
              ))}
          </ul>
        </div>
      ))}

      {feesOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Fee structure"
          className="fixed inset-0 z-50 flex items-end justify-center bg-maroon-950/50 p-4 backdrop-blur-[2px] sm:items-center"
          onClick={() => setFeesOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-line bg-paper p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-600">
                  Fee structure
                </p>
                <h3 className="mt-1 text-xl">Please get in touch</h3>
              </div>
              <button
                type="button"
                onClick={() => setFeesOpen(false)}
                aria-label="Close"
                className="-mr-2 -mt-1 rounded-full p-2 text-ink-muted hover:bg-maroon-50 hover:text-maroon-700"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <p className="mt-3 text-sm text-ink-soft">
              Our fees are shared directly by the admissions office so you always get the
              current figures. Call or send us a WhatsApp message and we will reply with
              the full structure.
            </p>

            <div className="mt-5 grid gap-3">
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-maroon-700 px-5 py-3 text-sm font-semibold text-white shadow-soft hover:bg-maroon-800"
              >
                <Icon name="phone" size={18} /> Call {phone}
              </a>
              <a
                href={waLink(whatsapp, 'Hello, please share the current fee structure for City Parents School.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-maroon-700/30 px-5 py-3 text-sm font-semibold text-maroon-800 hover:bg-maroon-50"
              >
                <Icon name="whatsapp" size={18} /> WhatsApp {phone}
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
