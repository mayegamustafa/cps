import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/ui/PageHero';
import { Icon } from '@/components/Icon';
import { serverApi } from '@/lib/api-base';

type Album = {
  slug: string;
  title: string;
  description?: string | null;
  category?: string | null;
  coverImage?: string | null;
  images?: string[];
};

async function getAlbum(slug: string): Promise<Album | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null;
  try {
    const res = await fetch(`${serverApi()}/api/gallery/${slug}`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const a = await res.json();
      if (a && a.slug) return a as Album;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAlbum(slug);
  return { title: a ? `${a.title} · Gallery` : 'Gallery' };
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = await getAlbum(slug);
  if (!album) notFound();
  const images = album.images?.length ? album.images : album.coverImage ? [album.coverImage] : [];

  return (
    <>
      <PageHero
        eyebrow={album.category ?? 'Gallery'}
        title={album.title}
        intro={album.description ?? undefined}
        crumbs={[{ label: 'Gallery', href: '/gallery' }, { label: album.title }]}
        image={album.coverImage ?? undefined}
      />

      <section className="py-20">
        <div className="container-page">
          {images.length === 0 ? (
            <p className="text-center text-ink-muted">No photos in this album yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="group relative aspect-square overflow-hidden rounded-xl">
                  <div className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${src}')` }} />
                </a>
              ))}
            </div>
          )}
          <div className="mt-12">
            <Link href="/gallery" className="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon-700">
              <Icon name="arrow-right" size={16} className="rotate-180" /> Back to gallery
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
