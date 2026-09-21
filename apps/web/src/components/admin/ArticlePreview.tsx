'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';
import { ArticleBody } from '@/components/ArticleBody';

/**
 * Shows an article the way a reader will see it, before it is published.
 *
 * It reuses the same `.article-body` styles and the same ArticleBody component
 * as the live page, rather than approximating them, so headings, quotes, tables,
 * pictures and social embeds all land where they will actually land. A preview
 * that renders differently from the real page is worse than no preview, because
 * it teaches you to trust something wrong.
 *
 * The phone width is offered because most readers are on one, and a layout that
 * only ever gets checked on a laptop is the layout that breaks.
 */
export function ArticlePreview({
  values,
  onClose,
}: {
  values: Record<string, string | boolean>;
  onClose: () => void;
}) {
  const [width, setWidth] = useState<'phone' | 'wide'>('wide');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const title = String(values.title ?? '').trim();
  const excerpt = String(values.excerpt ?? '').trim();
  const body = String(values.body ?? '');
  const cover = String(values.coverImage ?? '').trim();
  const status = String(values.status ?? 'DRAFT');
  const tags = String(values.tags ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const published = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Anything written before the editor existed is plain text with blank lines.
  const isHtml = /<(p|div|h[1-6]|ul|ol|li|blockquote|img|br|strong|em|a)\b/i.test(body);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-ink/50">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon name="eye" size={18} className="text-maroon-700" />
          <span className="text-sm font-semibold text-ink">Preview</span>
          <span className="rounded-full bg-paper-dark px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
            {status === 'PUBLISHED' ? 'Will be live' : status.toLowerCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-line bg-paper-dark/40 p-1">
            {(
              [
                ['wide', 'Desktop'],
                ['phone', 'Phone'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setWidth(key)}
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  width === key ? 'bg-maroon-700 text-white' : 'text-ink-soft hover:text-maroon-700',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-maroon-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-maroon-800"
          >
            Back to editing
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-paper-dark/40 p-4 sm:p-8">
        <div
          className={[
            'mx-auto bg-paper shadow-lg transition-all',
            width === 'phone' ? 'max-w-[400px] rounded-3xl' : 'max-w-3xl rounded-xl',
          ].join(' ')}
        >
          {cover ? (
            <div
              className={[
                'aspect-[16/9] w-full bg-cover bg-center',
                width === 'phone' ? 'rounded-t-3xl' : 'rounded-t-xl',
              ].join(' ')}
              style={{ backgroundImage: `url('${cover}')` }}
            />
          ) : null}

          <article className={width === 'phone' ? 'px-5 py-7' : 'px-10 py-10'}>
            {tags.length ? (
              <p className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                {tags.slice(0, 4).map((tag, i) => (
                  <span key={tag} className="flex items-center gap-2">
                    {i > 0 ? (
                      <span className="text-gold-500" aria-hidden>
                        &middot;
                      </span>
                    ) : null}
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-maroon-700">
                      {tag}
                    </span>
                  </span>
                ))}
              </p>
            ) : null}

            <h1
              className={[
                'font-display leading-tight text-maroon-900',
                width === 'phone' ? 'text-2xl' : 'text-4xl',
              ].join(' ')}
            >
              {title || 'Untitled article'}
            </h1>

            {excerpt ? (
              <p
                className={[
                  'mt-5 border-l-2 border-gold-400 pl-4 font-display italic leading-relaxed text-ink',
                  width === 'phone' ? 'text-lg' : 'text-2xl',
                ].join(' ')}
              >
                {excerpt}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-line py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon-700 text-sm font-semibold text-white">
                  CP
                </span>
                <span className="text-sm leading-tight">
                  <span className="block font-semibold text-ink">You</span>
                  <span className="flex items-center gap-1.5 text-ink-muted">
                    <Icon name="calendar" size={14} /> {published}
                  </span>
                </span>
              </div>
              <span className="text-xs text-ink-muted">Share buttons appear here</span>
            </div>

            <div
              className={[
                'article-body mt-8 max-w-none leading-relaxed text-ink-soft',
                width === 'phone' ? 'text-base' : 'text-lg',
              ].join(' ')}
            >
              {body.trim() ? (
                isHtml ? (
                  <ArticleBody html={body} />
                ) : (
                  body
                    .split('\n')
                    .filter(Boolean)
                    .map((p, i) => <p key={i}>{p}</p>)
                )
              ) : (
                <p className="text-ink-muted">
                  Nothing written yet. Close this and start typing in the Body.
                </p>
              )}
            </div>
          </article>
        </div>

        <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-paper/80">
          The byline shows your name once saved. Social embeds load here exactly as they will on the
          site.
        </p>
      </div>
    </div>
  );
}
