import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/ui/PageHero';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { ShareButtons } from '@/components/ShareButtons';

type Article = {
  slug: string;
  title: string;
  excerpt?: string | null;
  body?: string;
  coverImage?: string | null;
  publishedAt?: string | null;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
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
      <PageHero
        eyebrow="News"
        title={a.title}
        crumbs={[{ label: 'News & Events', href: '/news' }, { label: a.title }]}
        image={a.coverImage ?? 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=2000&q=70'}
      />

      <article className="py-20">
        <div className="container-page max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <Icon name="calendar" size={16} /> {published}
            </p>
            <ShareButtons title={a.title} path={`/news/${slug}`} />
          </div>

          <div className="prose mt-8 max-w-none text-lg leading-relaxed text-ink-soft">
            {a.body ? (
              a.body.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)
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
