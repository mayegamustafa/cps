import type { Metadata } from 'next';
import { assertPageEnabled } from '@/lib/page-guard';
import Link from 'next/link';
import { ConfigurablePageHero } from '@/components/ui/ConfigurablePageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Icon } from '@/components/Icon';
import { recordings } from '@/lib/content';
import { getAlbums, getSocialWall } from '@/lib/public-data';
import type { IconName } from '@/components/Icon';

export const metadata: Metadata = {
  title: 'Gallery & Media',
  description:
    'Photo albums and video highlights from sports, academics, graduation, trips and events at City Parents School.',
};

export default async function GalleryPage() {
  await assertPageEnabled('gallery');
  const [galleryAlbums, social] = await Promise.all([getAlbums(), getSocialWall()]);
  return (
    <>
      <ConfigurablePageHero page="gallery"
        eyebrow="Media Center"
        title="Life at City Parents, in pictures and film."
        intro="Browse moments from across our school year, sports, academics, the arts, trips and our biggest celebrations."
        crumbs={[{ label: 'Gallery' }]}
        image="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=2000&q=70"
      />

      {/* Photo albums */}
      <section className="py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Photo albums" title="Captured moments" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {galleryAlbums.map((a, i) => {
              const Card = (
                <>
                  <div className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${a.image}')` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/85 via-maroon-950/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gold-300">{a.category}</span>
                    <h3 className="text-xl !text-white">{a.title}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-paper/80">
                      <Icon name="image" size={14} /> {a.count > 0 ? `${a.count} photos` : 'View album'}
                    </p>
                  </div>
                </>
              );
              const cls = 'group relative block aspect-[4/3] overflow-hidden rounded-2xl text-left';
              return a.slug ? (
                <Link key={i} href={`/gallery/${a.slug}`} className={cls}>{Card}</Link>
              ) : (
                <div key={i} className={cls}>{Card}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video recordings */}
      <section className="bg-maroon-950 py-24 text-white">
        <div className="container-page">
          <SectionHeading tone="dark" eyebrow="Video gallery" title="Watch the highlights" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {recordings.map((r) => (
              <div key={r.title} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <div className="relative flex aspect-video items-center justify-center bg-maroon-900">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold-400 text-maroon-900">
                    <Icon name="play" size={26} />
                  </span>
                  <span className="absolute bottom-3 right-3 rounded bg-maroon-950/80 px-2 py-0.5 text-xs">{r.duration}</span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg !text-white">{r.title}</h3>
                  <p className="mt-1 text-sm text-paper/60">{r.date} · {r.views} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social wall */}
      {social.length > 0 ? (
        <section className="py-24">
          <div className="container-page">
            <SectionHeading align="center" eyebrow="Social wall" title="Follow our journey" intro="The latest from our social channels." />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {social.map((p) => (
                <a key={p.id} href={p.permalink} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-2xl border border-line bg-paper transition-all hover:-translate-y-1 hover:shadow-lift">
                  {p.thumbnailUrl ? (
                    <div className="relative aspect-square overflow-hidden">
                      <div className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${p.thumbnailUrl}')` }} />
                      {p.isVideo ? (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-maroon-800"><Icon name="play" size={22} /></span>
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="p-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-maroon-600">
                      <Icon name={p.network as IconName} size={14} /> {p.network}
                    </span>
                    <p className="mt-1.5 line-clamp-2 text-sm text-ink-soft">{p.caption}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
