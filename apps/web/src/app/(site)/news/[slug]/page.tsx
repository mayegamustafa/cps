import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/ui/PageHero';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { ShareButtons } from '@/components/ShareButtons';
import { ArticleBody } from '@/components/ArticleBody';
import { serverApi } from '@/lib/api-base';

type Article = {
  slug: string;
  title: string;
  excerpt?: string | null;
  body?: string;
  coverImage?: string | null;
  publishedAt?: string | null;
  tags?: string[];
  author?: { firstName?: string; lastName?: string; avatarUrl?: string | null } | null;
};

const API = serverApi();
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

function titleFromSlug(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Live article by slug, with a graceful shell when the API is unavailable.
async function getArticle(slug: string): Promise<Article> {
  try {
    const res = await fetch(`${API}/api/news/${slug}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) return (await res.json()) as Article;
  } catch {
    /* fall through */
  }
  return { slug, title: titleFromSlug(slug) };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(slug);
  const url = `${SITE}/news/${slug}`;
  const description = a.excerpt ?? `Read the latest from City Parents School: ${a.title}.`;
  const image = a.coverImage ?? `${SITE}/cps.png`;
  return {
    title: a.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: a.title,
      description,
      siteName: 'City Parents School',
      images: [{ url: image }],
    },
    twitter: { card: 'summary_large_image', title: a.title, description, images: [image] },
  };
}

function initialsOf(author?: { firstName?: string; lastName?: string } | null): string {
  if (!author) return 'CP';
  return ((author.firstName?.[0] ?? '') + (author.lastName?.[0] ?? '')).toUpperCase() || 'CP';
}

/** Categories double as the eyebrow above the headline and as filters on /news. */
function TagLine({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;
  return (
    <p className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
      {tags.slice(0, 4).map((tag, i) => (
        <span key={tag} className="flex items-center gap-2">
          {i > 0 ? <span className="text-gold-500" aria-hidden>&middot;</span> : null}
          <Link
            href={`/news?tag=${encodeURIComponent(tag)}`}
            className="text-xs font-semibold uppercase tracking-[0.12em] text-maroon-700 hover:text-maroon-900"
          >
            {tag}
          </Link>
        </span>
      ))}
    </p>
  );
}

/** True when the stored body came from the editor rather than a plain textarea. */
function isHtml(body: string): boolean {
  return /<(p|div|h[1-6]|ul|ol|li|blockquote|img|br|strong|em|a)\b/i.test(body);
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = await getArticle(slug);
  const published = a.publishedAt
    ? new Date(a.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Recently published';

  return (
    <>
      {/*
        The headline sits on paper and the photograph runs full width beneath it,
        rather than the photograph being buried under a dark panel so the type
        can sit on top. A cover photo of pupils collecting a trophy is worth
        showing; dimming it to 20% to make white text legible wastes the picture
        and makes every article look identical.
      */}
      <article>
        <header className="border-b border-line bg-paper">
          <div className="container-page max-w-3xl pb-10 pt-12 sm:pt-16">
            <nav aria-label="Breadcrumb" className="mb-6 text-xs text-ink-muted">
              <Link href="/" className="hover:text-maroon-700">
                Home
              </Link>
              <span className="mx-1.5">/</span>
              <Link href="/news" className="hover:text-maroon-700">
                News &amp; Events
              </Link>
            </nav>

            <TagLine tags={a.tags} />

            <h1 className="font-display text-3xl leading-[1.12] text-maroon-900 sm:text-4xl md:text-5xl">
              {a.title}
            </h1>

            {a.excerpt ? (
              <p className="mt-5 font-display text-xl leading-relaxed text-ink-soft sm:text-2xl">
                {a.excerpt}
              </p>
            ) : null}
          </div>

          {a.coverImage ? (
            <figure className="container-page max-w-5xl pb-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.coverImage}
                alt=""
                className="w-full rounded-2xl object-cover shadow-soft"
              />
            </figure>
          ) : null}
        </header>

        <div className="container-page max-w-3xl py-12">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            <div className="flex items-center gap-3">
              {a.author?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.author.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon-700 text-sm font-semibold text-white">
                  {initialsOf(a.author)}
                </span>
              )}
              <span className="text-sm leading-tight">
                {a.author ? (
                  <span className="block font-semibold text-ink">
                    {a.author.firstName} {a.author.lastName}
                  </span>
                ) : (
                  <span className="block font-semibold text-ink">City Parents School</span>
                )}
                <span className="flex items-center gap-1.5 text-ink-muted">
                  <Icon name="calendar" size={14} /> {published}
                </span>
              </span>
            </div>
            <ShareButtons title={a.title} path={`/news/${slug}`} />
          </div>

          <div className="article-body mt-8 max-w-none text-lg leading-relaxed text-ink-soft">
            {a.body ? (
              isHtml(a.body) ? (
                // Written in the editor and stored as HTML. The API strips
                // scripts, handlers and unsafe URLs before saving, so what
                // reaches here is already an allowlisted subset. ArticleBody
                // additionally swaps embed markers for real social embeds.
                <ArticleBody html={a.body} />
              ) : (
                // Anything written before the editor existed is plain text with
                // blank lines between paragraphs.
                a.body.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)
              )
            ) : (
              <>
                <p>
                  City Parents School is delighted to share this update with our
                  community of families, pupils, staff and alumni.
                </p>
                <p>
                  Stories like this reflect the daily dedication of our teachers and
                  the ambition of our learners.
                </p>
              </>
            )}
          </div>

          <div className="mt-12 flex items-center justify-between border-t border-line pt-8">
            <Link href="/news" className="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon-700">
              <Icon name="arrow-right" size={16} className="rotate-180" /> Back to news
            </Link>
            <Button href="/admissions" icon="arrow-right">Apply Now</Button>
          </div>
        </div>
      </article>
    </>
  );
}
