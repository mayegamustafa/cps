'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { Icon, type IconName } from '@/components/Icon';
import { Button } from '@/components/ui/Button';
import { primaryNav, siteDefaults, isHrefEnabled, type SiteConfig } from '@/lib/site';

export function Header({ config = siteDefaults }: { config?: SiteConfig }) {
  const { brand, contact } = config;
  const nav = primaryNav.filter((item) => isHrefEnabled(config, item.href));
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || (href !== '/' && pathname?.startsWith(href + '/'));
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        setScrolled(y > 16);
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(scrollable > 0 ? Math.min(1, y / scrollable) : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  return (
    <header className="sticky top-0 z-50">
      {/* Utility bar */}
      <div className="hidden bg-maroon-900 text-paper/80 md:block">
        <div className="container-page flex h-9 items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 hover:text-white">
              <Icon name="phone" size={14} /> {contact.phone}
            </a>
            <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-white">
              <Icon name="mail" size={14} /> {contact.email}
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/portal" className="hover:text-white">Parent Portal</Link>
            <span className="text-paper/30">·</span>
            <Link href="/live" className="flex items-center gap-1.5 text-gold-300 hover:text-gold-200">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-400" />
              </span>
              Live TV
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div
        className={[
          'relative border-b transition-all duration-300',
          scrolled
            ? 'border-line bg-paper/90 backdrop-blur-md shadow-soft'
            : 'border-transparent bg-paper/70 backdrop-blur',
        ].join(' ')}
      >
        {/* Reading-progress hairline: a cheap, quiet signal of how long the page
            is, which matters most on a phone where the scrollbar is invisible. */}
        <div
          aria-hidden
          className={`absolute inset-x-0 top-0 h-0.5 origin-left bg-gold-400 transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`}
          style={{ transform: `scaleX(${progress})` }}
        />
        <div
          className={`container-page flex items-center justify-between transition-[height] duration-300 ${scrolled ? 'h-16' : 'h-[4.5rem]'}`}
        >
          <Logo logoUrl={brand.logoUrl} name={brand.name} locality={brand.locality} />

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-maroon-50 hover:text-maroon-800 ${isActive(item.href) ? 'bg-maroon-50 text-maroon-800' : 'text-ink-soft'}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="rounded-full p-2.5 text-maroon-800 hover:bg-maroon-50 lg:hidden"
            >
              <Icon name={open ? 'close' : 'menu'} size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu — full screen. A 6-inch screen has no reason to squeeze
          navigation into a narrow drawer, and the extra room buys large,
          thumb-sized targets plus the admissions and contact actions that used
          to be reachable only from the floating capsule. */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <nav
            aria-label="Mobile"
            className="flex h-[100dvh] flex-col overflow-y-auto bg-paper animate-rise"
          >
            <div className="container-page flex h-[4.5rem] shrink-0 items-center justify-between">
              <Logo logoUrl={brand.logoUrl} name={brand.name} locality={brand.locality} />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="-mr-2 rounded-full p-2.5 text-maroon-800 hover:bg-maroon-50"
              >
                <Icon name="close" size={24} />
              </button>
            </div>

            <div className="container-page flex flex-1 flex-col pb-8">
              <ul className="flex flex-col divide-y divide-line border-y border-line">
                {[{ href: '/', label: 'Home' }, ...nav].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      className={`flex items-center justify-between py-4 font-display text-2xl transition-colors ${isActive(item.href) ? 'text-maroon-700' : 'text-maroon-900 hover:text-maroon-700'}`}
                    >
                      {item.label}
                      <Icon name="arrow-up-right" size={20} className="text-gold-600" />
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-7 grid gap-3">
                <Button href="/admissions" variant="primary" size="lg" icon="arrow-right" className="w-full">
                  Apply Now
                </Button>
                <Button href="/portal" variant="outline" size="lg" className="w-full">Parent Portal</Button>
              </div>

              <div className="mt-8 space-y-2.5 text-sm text-ink-soft">
                <a href={`tel:${contact.phone}`} className="flex items-center gap-2.5 hover:text-maroon-700">
                  <Icon name="phone" size={16} className="text-maroon-700" /> {contact.phone}
                </a>
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 hover:text-maroon-700">
                  <Icon name="mail" size={16} className="text-maroon-700" /> {contact.email}
                </a>
              </div>

              {config.social.length ? (
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {config.social.map((s) => (
                    <a
                      key={s.href}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-maroon-800 hover:bg-maroon-50"
                    >
                      <Icon name={s.network as IconName} size={18} />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
