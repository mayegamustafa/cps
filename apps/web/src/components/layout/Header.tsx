'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/ui/Button';
import { primaryNav, siteDefaults, isHrefEnabled, type SiteConfig } from '@/lib/site';

export function Header({ config = siteDefaults }: { config?: SiteConfig }) {
  const { brand, contact } = config;
  const nav = primaryNav.filter((item) => isHrefEnabled(config, item.href));
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || (href !== '/' && pathname?.startsWith(href + '/'));
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
          'border-b transition-all duration-300',
          scrolled
            ? 'border-line bg-paper/90 backdrop-blur-md shadow-soft'
            : 'border-transparent bg-paper/70 backdrop-blur',
        ].join(' ')}
      >
        <div className="container-page flex h-[4.5rem] items-center justify-between py-3">
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

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 top-0 z-40 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-maroon-950/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <nav
            aria-label="Mobile"
            className="absolute right-0 top-0 flex h-full w-[82%] max-w-sm flex-col bg-paper p-6 shadow-lift animate-rise"
          >
            <div className="mb-6 flex items-center justify-between">
              <Logo logoUrl={brand.logoUrl} name={brand.name} locality={brand.locality} />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-full p-2 text-maroon-800 hover:bg-maroon-50"
              >
                <Icon name="close" size={24} />
              </button>
            </div>
            <ul className="flex flex-col gap-1">
              <li>
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium text-maroon-800 hover:bg-maroon-50"
                >
                  Home
                  <Icon name="home" size={18} />
                </Link>
              </li>
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium hover:bg-maroon-50 ${isActive(item.href) ? 'bg-maroon-50 text-maroon-800' : 'text-ink'}`}
                  >
                    {item.label}
                    <Icon name="chevron-right" size={18} />
                  </Link>
                </li>
              ))}
            </ul>
            {/* Apply is handled by the floating capsule on mobile — no duplicate CTA here. */}
            <div className="mt-6">
              <Button href="/portal" variant="outline" size="lg" className="w-full">Parent Portal</Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
