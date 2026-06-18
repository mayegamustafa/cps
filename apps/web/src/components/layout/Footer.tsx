import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Icon, type IconName } from '@/components/Icon';
import { footerNav, siteDefaults, type SiteConfig } from '@/lib/site';

export function Footer({ config = siteDefaults }: { config?: SiteConfig }) {
  const { brand, contact, address, social, description } = config;
  return (
    <footer className="bg-maroon-950 text-paper/70">
      <div className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo tone="light" logoUrl={brand.logoLightUrl} name={brand.name} locality={brand.locality} />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-paper/60">
              {description}
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <p className="flex items-start gap-2.5">
                <Icon name="map-pin" size={18} className="mt-0.5 shrink-0 text-gold-400" />
                <span>
                  {address.line1}, {address.poBox}
                  <br />
                  {address.city}, {address.country}
                </span>
              </p>
              <a href={`tel:${contact.phone}`} className="flex items-center gap-2.5 hover:text-white">
                <Icon name="phone" size={18} className="text-gold-400" />
                {contact.phone}
              </a>
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 hover:text-white">
                <Icon name="mail" size={18} className="text-gold-400" />
                {contact.email}
              </a>
            </div>
            <div className="mt-6 flex gap-2">
              {social.map((s) => (
                <a
                  key={s.network}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-paper/15 p-2.5 text-paper/70 transition-colors hover:border-gold-400 hover:text-gold-300"
                >
                  <Icon name={s.network as IconName} size={18} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {Object.entries(footerNav).map(([heading, links]) => (
              <div key={heading}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
                  {heading}
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-paper/10 pt-8 text-xs text-paper/50 sm:flex-row">
          <p>© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Use</Link>
            <Link href="/downloads" className="hover:text-white">Downloads</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
