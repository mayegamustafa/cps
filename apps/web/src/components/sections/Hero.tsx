import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { HeroMedia } from '@/components/sections/HeroMedia';
import { videoPoster } from '@/lib/media';
import { siteDefaults, waLink, type SiteConfig } from '@/lib/site';

export function Hero({ config = siteDefaults }: { config?: SiteConfig }) {
  const { hero, contact, brand } = config;
  // Still frame priority: the configured image, else a frame lifted from the
  // video, else the packaged default. Never leave the hero without a first paint.
  const poster =
    hero.backgroundImage ||
    videoPoster(hero.backgroundVideo) ||
    siteDefaults.hero.backgroundImage;

  return (
    <section className="relative isolate overflow-hidden bg-maroon-950 text-white">
      <HeroMedia src={hero.backgroundVideo} poster={poster} alt={`${brand.name} campus life`} />

      {/* Scrim. On mobile the copy spans the full width, so it needs a bottom-up
          gradient; the left-to-right one only works for the desktop two-column
          layout, where it keeps the photograph visible on the right. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-maroon-950 via-maroon-950/75 to-maroon-950/20 lg:bg-gradient-to-r lg:from-maroon-950/80 lg:via-maroon-950/45 lg:to-maroon-900/10"
      />

      <div className="container-page flex min-h-[86svh] flex-col justify-end gap-10 pb-14 pt-28 lg:grid lg:min-h-[88vh] lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-20">
        <div className="max-w-2xl animate-rise">
          <span className="eyebrow !text-gold-300">{hero.eyebrow}</span>

          {/* Fluid so a long word like "character." never runs off a 360px screen. */}
          <h1 className="mt-4 text-balance text-[clamp(2rem,9vw,2.75rem)] font-medium leading-[1.03] text-white sm:text-5xl lg:mt-6 lg:text-6xl">
            {hero.titleLead}
            <span className="block text-gold-300">{hero.titleAccent}</span>
          </h1>

          {/* Clamped to two lines on a phone: a parent decides in seconds, and the
              full paragraph lives on the About page. Uncapped from `sm` up. */}
          <p className="mt-4 line-clamp-2 max-w-xl text-base leading-relaxed text-paper/85 sm:line-clamp-none sm:text-lg lg:mt-6">
            {hero.intro}
          </p>

          <div
            data-apply-anchor
            className="mt-7 grid gap-2.5 sm:flex sm:flex-wrap sm:gap-3 lg:mt-9"
          >
            <Button
              href={hero.primaryCta.href}
              variant="gold"
              size="lg"
              icon="arrow-right"
              className="w-full sm:w-auto"
            >
              {hero.primaryCta.label}
            </Button>
            <Button
              href={hero.secondaryCta.href}
              size="lg"
              className="w-full border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20 sm:w-auto"
            >
              <Icon name="play" size={18} /> {hero.secondaryCta.label}
            </Button>
          </div>

          {/* Proof strip. Tight enough on mobile to stay inside the first screen —
              this is the fastest reassurance a prospective parent gets. */}
          {hero.stats.length ? (
            <dl className="mt-8 grid grid-cols-3 gap-3 border-t border-white/20 pt-6 sm:gap-6 lg:mt-12 lg:max-w-lg lg:pt-8">
              {hero.stats.map((s) => (
                <div key={s.label}>
                  <dt className="font-display text-2xl text-gold-300 sm:text-3xl">{s.value}</dt>
                  <dd className="mt-0.5 text-xs leading-tight text-paper/75 sm:mt-1 sm:text-sm">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {/* Live / quick-access card */}
        <div className="hidden lg:block">
          <div className="ml-auto max-w-sm rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md shadow-lift animate-rise">
            <div className="flex items-center gap-2 text-sm font-semibold text-gold-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-400" />
              </span>
              {hero.live.status}
            </div>
            <p className="mt-3 font-display text-xl text-white">
              {hero.live.message}
            </p>
            <Button href="/live" variant="gold" size="md" icon="arrow-up-right" className="mt-5 w-full">
              {hero.live.ctaLabel}
            </Button>
            <a
              href={waLink(contact.whatsapp, 'Hello, I would like to chat with Admissions.')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
            >
              <Icon name="whatsapp" size={18} /> {hero.live.chatLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
