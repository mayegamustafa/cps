import Link from 'next/link';
import Image from 'next/image';
import { siteDefaults } from '@/lib/site';

/** School crest + wordmark. The badge image is admin-changeable via settings. */
export function Logo({
  tone = 'dark',
  logoUrl = siteDefaults.brand.logoUrl,
  name = siteDefaults.brand.name,
  locality = siteDefaults.brand.locality,
  className = '',
}: {
  tone?: 'dark' | 'light';
  logoUrl?: string;
  name?: string;
  locality?: string;
  className?: string;
}) {
  const ink = tone === 'light' ? '#ffffff' : 'var(--color-maroon-800)';
  const sub =
    tone === 'light' ? 'rgba(255,255,255,0.7)' : 'var(--color-ink-muted)';

  return (
    <Link
      href="/"
      aria-label={`${name}, home`}
      className={`group inline-flex items-center gap-3 ${className}`}
    >
      <span
        className={[
          'relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full',
          tone === 'light' ? 'bg-white p-0.5 ring-1 ring-white/40' : '',
        ].join(' ')}
      >
        <Image
          src={logoUrl}
          alt=""
          aria-hidden
          width={44}
          height={44}
          className="h-full w-full object-contain"
          priority
          unoptimized
        />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className="font-display text-lg font-semibold tracking-tight"
          style={{ color: ink }}
        >
          {name}
        </span>
        <span
          className="text-[0.64rem] font-semibold uppercase tracking-[0.22em]"
          style={{ color: sub }}
        >
          {locality}
        </span>
      </span>
    </Link>
  );
}
