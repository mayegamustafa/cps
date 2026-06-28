import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';

const QUICK_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Admissions', href: '/admissions' },
  { label: 'News & Events', href: '/news' },
  { label: 'Contact', href: '/contact' },
];

/** Friendly, branded "page not available" content (used by the site and root
 *  not-found boundaries). SVG icons only, no emojis. */
export function NotFoundView() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6 py-24">
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-maroon-50 text-maroon-700">
          <Icon name="map-pin" size={30} />
        </span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Error 404</p>
        <h1 className="mt-3 font-display text-3xl text-maroon-900 sm:text-4xl">This page isn&rsquo;t available</h1>
        <p className="mx-auto mt-4 max-w-md text-ink-soft">
          The page you&rsquo;re looking for may have moved, or it&rsquo;s coming soon. Let&rsquo;s get you back on track.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/" icon="arrow-right">Back to homepage</Button>
          <Button href="/contact" variant="outline">Contact us</Button>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          {QUICK_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="font-medium text-maroon-700 hover:underline">{l.label}</Link>
          ))}
        </div>
      </div>
    </section>
  );
}
