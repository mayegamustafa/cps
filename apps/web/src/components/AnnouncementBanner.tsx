import Link from 'next/link';
import { img, imgSrcSet } from '@/lib/media';
import { currentPath, deviceClass, getAnnouncements, showsOnPage } from '@/lib/announcements';

/**
 * A poster across the top of the page, directly under the menu.
 *
 * The picture is shown whole rather than cropped to a strip: school posters are
 * usually portrait, and the dates that matter sit at the bottom, which is exactly
 * what a fixed-height band cuts off. The height is capped so the band cannot push
 * the rest of the page off the screen, and the artwork is centred on the school's
 * own colour so the edges look deliberate.
 */
export async function AnnouncementBanner() {
  const items = await getAnnouncements();
  if (!items.length) return null;
  const pathname = await currentPath();
  const a = items.find((x) => x.layout === 'image' && x.imageUrl && showsOnPage(x, pathname));
  if (!a?.imageUrl) return null;

  const picture = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={img(a.imageUrl, 1600)}
      srcSet={imgSrcSet(a.imageUrl) || undefined}
      sizes="100vw"
      alt={a.title || a.message || 'Announcement'}
      className="mx-auto block max-h-[34vh] w-auto max-w-full object-contain sm:max-h-[42vh]"
    />
  );

  return (
    <section aria-label={a.title || 'Announcement'} className={`bg-maroon-950 ${deviceClass(a.device)}`}>
      {a.link ? (
        <Link href={a.link} className="block transition-opacity hover:opacity-95" aria-label={a.linkLabel || a.title || 'Open announcement'}>
          {picture}
        </Link>
      ) : (
        picture
      )}
    </section>
  );
}
