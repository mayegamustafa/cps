import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { siteDefaults, waLink, type SiteConfig } from '@/lib/site';

export function Hero({ config = siteDefaults }: { config?: SiteConfig }) {
  const { hero, contact } = config;
  // Image layer falls back to the default only when nothing is configured.
  const heroImage = hero.backgroundImage || siteDefaults.hero.backgroundImage;

  return (
    <section className="relative isolate overflow-hidden bg-maroon-950 text-white">
      {/* Background: autoplaying muted video when configured, else image */}
      {hero.backgroundVideo ? (
        <video
          aria-hidden
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={hero.backgroundImage || undefined}
          className="absolute inset-0 -z-10 h-full w-full bg-maroon-950 object-cover"
        >
          <source src={hero.backgroundVideo} />
        </video>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url('${heroImage}')` }}
        />
      )}
      {/* Lighter scrim: darker on the left for text legibility, fading right so
          the background image/video stays clearly visible. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-maroon-950/75 via-maroon-950/40 to-maroon-900/15"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-maroon-950/50 via-transparent to-transparent"
      />

      <div className="container-page grid min-h-[88vh] items-center gap-12 py-20 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="max-w-2xl animate-rise">
          <span className="eyebrow !text-gold-300">{hero.eyebrow}</span>
          <h1 className="mt-6 text-balance text-4xl font-medium leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            {hero.titleLead}
            <span className="block text-gold-300">{hero.titleAccent}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/80">
            {hero.intro}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Button href={hero.primaryCta.href} variant="gold" size="lg" icon="arrow-right">
              {hero.primaryCta.label}
            </Button>
            <Button
              href={hero.secondaryCta.href}
              size="lg"
              className="border border-white/25 bg-white/5 text-white backdrop-blur hover:bg-white/10"
            >
              <Icon name="play" size={18} /> {hero.secondaryCta.label}
            </Button>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/15 pt-8">
            {hero.stats.map((s) => (
              <div key={s.label}>
                <dt className="font-display text-3xl text-gold-300">{s.value}</dt>
                <dd className="mt-1 text-sm text-paper/70">{s.label}</dd>
              </div>
            ))}
          </dl>
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
