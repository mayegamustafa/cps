import Link from 'next/link';
import { Hero } from '@/components/sections/Hero';
import { StatsBand } from '@/components/sections/StatsBand';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { CoverImage } from '@/components/ui/CoverImage';
import { ReadMore } from '@/components/ui/ReadMore';
import { Icon } from '@/components/Icon';
import { SocialFeeds } from '@/components/sections/SocialFeeds';
import { waLink } from '@/lib/site';
import { getSiteConfig } from '@/lib/site-config';
import { getStats } from '@/lib/stats';
import { getNews, getAlbums } from '@/lib/public-data';

export const revalidate = 30;

export default async function HomePage() {
  const config = await getSiteConfig();
  const stats = await getStats();
  const news = (await getNews()).slice(0, 3);
  const albums = (await getAlbums()).slice(0, 6);
  const { welcome, pathways, why, admissionsCta, news: newsHeading, gallery: galleryHeading, testimonials, visit, headTeacher: ht, feeds } = config.home;
  const { address, contact } = config;
  const s = config.sections;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${config.coords.lat},${config.coords.lng}`;
  return (
    <>
      <Hero config={config} />
      <StatsBand stats={stats} />

      {/* Welcome */}
      {s.welcome !== false ? (
      <section className="section">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-lift sm:aspect-[4/5]">
              <CoverImage
                src={welcome.image}
                alt={welcome.title}
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              {/* On a phone the stat rides on the photo instead of floating beside
                  it — same proof, no extra vertical scroll. */}
              {welcome.statValue ? (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-maroon-950/90 to-transparent p-5 pt-16 sm:hidden">
                  <p className="font-display text-3xl text-gold-300">{welcome.statValue}</p>
                  <p className="mt-0.5 text-sm text-paper/85">{welcome.statLabel}</p>
                </div>
              ) : null}
            </div>
            {welcome.statValue ? (
              <div className="absolute -bottom-6 -right-2 hidden rounded-2xl border border-line bg-paper p-6 shadow-soft sm:block">
                <p className="font-display text-4xl text-maroon-700">{welcome.statValue}</p>
                <p className="mt-1 max-w-[10rem] text-sm text-ink-soft">{welcome.statLabel}</p>
              </div>
            ) : null}
          </div>

          <div>
            <SectionHeading eyebrow={welcome.eyebrow} title={welcome.title} intro={welcome.intro} />
            <ul className="mt-7 space-y-3 lg:mt-8">
              {welcome.bullets.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-ink-soft sm:text-base">
                  <span className="mt-0.5 text-maroon-600 sm:mt-1">
                    <Icon name="shield-check" size={20} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3 lg:mt-9">
              {welcome.primaryCta.label ? <Button href={welcome.primaryCta.href} icon="arrow-right">{welcome.primaryCta.label}</Button> : null}
              {welcome.secondaryCta.label ? <Button href={welcome.secondaryCta.href} variant="outline">{welcome.secondaryCta.label}</Button> : null}
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {/* Head Teacher's message — a dark band so the portrait carries weight and
          the page stops reading as one continuous sheet of white. */}
      {s.headTeacher !== false && ht.message ? (
        <section className="section bg-maroon-950 text-white">
          <div className="container-page grid items-center gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
            {/* Square portrait, not a circle: a circular crop cuts into the
                shoulders of a formal portrait and reads as an avatar rather
                than a headmaster's photograph. */}
            <div className="mx-auto w-48 sm:w-60 lg:w-full lg:max-w-xs">
              <div className="relative aspect-square overflow-hidden rounded-2xl ring-1 ring-gold-400/40 shadow-lift lg:aspect-[4/5] lg:ring-0">
                {ht.image ? (
                  <CoverImage src={ht.image} alt={ht.name} sizes="(min-width: 1024px) 25vw, 60vw" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-maroon-900 text-gold-300">
                    <Icon name="graduation-cap" size={56} />
                  </div>
                )}
              </div>
            </div>
            <div className="text-center lg:text-left">
              <span className="eyebrow !text-gold-300 justify-center lg:justify-start">{ht.eyebrow}</span>
              <blockquote className="mt-4 lg:mt-5">
                <span className="inline-block text-gold-400"><Icon name="quote" size={30} /></span>
                <ReadMore
                  lines={4}
                  tone="dark"
                  className="mt-2 font-display text-lg leading-relaxed text-paper sm:text-2xl"
                >
                  {ht.message}
                </ReadMore>
              </blockquote>
              <div className="mt-6">
                <p className="font-semibold text-white">{ht.name}</p>
                <p className="text-sm text-paper/70">{ht.title}</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Academic pathways */}
      {s.pathways !== false && pathways.items.length ? (
        <section className="section bg-paper-dark">
          <div className="container-page">
            <SectionHeading eyebrow={pathways.eyebrow} title={pathways.title} intro={pathways.intro} />
            <div className="mt-9 grid gap-5 md:mt-12 md:grid-cols-3 md:gap-6">
              {pathways.items.map((p) => (
                <Link
                  key={p.name}
                  href={p.href}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:border-maroon-700/30 hover:shadow-lift"
                >
                  {p.image ? (
                    // A photograph the width of the card says far more about a
                    // stage of school than the 64px thumbnail it replaces.
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <CoverImage
                        src={p.image}
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-maroon-950/55 to-transparent" />
                      <p className="absolute bottom-3 left-5 text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">
                        {p.age}
                      </p>
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    {!p.image ? (
                      <>
                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-maroon-700 text-gold-300 transition-colors group-hover:bg-maroon-800">
                          <Icon name={p.icon} size={26} />
                        </span>
                        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">{p.age}</p>
                      </>
                    ) : null}
                    <h3 className={`text-xl sm:text-2xl ${p.image ? '' : 'mt-2'}`}>{p.name}</h3>
                    <p className="clamp-mobile mt-2.5 flex-1 text-sm text-ink-soft sm:text-base" style={{ WebkitLineClamp: 2 }}>
                      {p.blurb}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-maroon-700">
                      Explore programme
                      <Icon name="arrow-right" size={16} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Why choose us — a two-column scan on mobile rather than six stacked
          blocks; value propositions must all stay visible, never hidden in a
          carousel. */}
      {s.why !== false && why.items.length ? (
        <section className="section">
          <div className="container-page">
            <SectionHeading align="center" eyebrow={why.eyebrow} title={why.title} />
            <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-10 sm:gap-y-12 lg:mt-14 lg:grid-cols-3">
              {why.items.map((v) => (
                <div key={v.title} className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-maroon-700 sm:mt-0.5">
                    <Icon name={v.icon} size={22} />
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg">{v.title}</h3>
                    <p className="clamp-mobile mt-1.5 text-sm leading-relaxed text-ink-soft" style={{ WebkitLineClamp: 3 }}>
                      {v.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Admissions CTA */}
      {s.admissionsCta !== false ? (
      <section className="pb-4 pt-10 sm:py-12">
        <div className="container-page">
          <div className="relative isolate overflow-hidden rounded-3xl bg-maroon-900 px-6 py-12 text-white sm:px-16 sm:py-16">
            <CoverImage
              src={admissionsCta.image}
              sizes="100vw"
              className="-z-10 opacity-20"
            />
            <div className="grid items-center gap-7 lg:grid-cols-[1.6fr_1fr] lg:gap-8">
              <div>
                <span className="eyebrow !text-gold-300">{admissionsCta.eyebrow}</span>
                <h2 className="mt-4 max-w-2xl text-3xl !text-white sm:text-4xl">{admissionsCta.title}</h2>
                <p className="clamp-mobile mt-4 max-w-xl text-paper/80" style={{ WebkitLineClamp: 3 }}>
                  {admissionsCta.intro}
                </p>
              </div>
              <div data-apply-anchor className="flex flex-col gap-3 lg:items-end">
                {admissionsCta.primaryCta.label ? (
                  <Button href={admissionsCta.primaryCta.href} variant="gold" size="lg" icon="arrow-right" className="w-full lg:w-auto">
                    {admissionsCta.primaryCta.label}
                  </Button>
                ) : null}
                {admissionsCta.secondaryCta.label ? (
                  <Button
                    href={admissionsCta.secondaryCta.href}
                    size="lg"
                    className="w-full border border-white/25 bg-transparent text-white hover:bg-white/10 lg:w-auto"
                  >
                    {admissionsCta.secondaryCta.label}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      ) : null}

      {/* Latest news — a swipe rail on mobile. News cards are homogeneous and
          browsable, which is the only kind of content a rail suits. */}
      {s.news !== false && news.length ? (
        <section className="section">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow={newsHeading.eyebrow} title={newsHeading.title} />
              {/* Wrapped rather than given `hidden` directly: Button's own
                  `inline-flex` base class competes with it and wins. */}
              <div className="hidden sm:block">
                <Button href="/news" variant="outline" icon="arrow-right">View all news</Button>
              </div>
            </div>
            <div className="rail mt-8 md:mt-12 md:grid-cols-3">
              {news.map((n) => (
                <Link
                  key={n.slug}
                  href={`/news/${n.slug}`}
                  className="group w-[78vw] max-w-[20rem] overflow-hidden rounded-2xl border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:w-auto md:max-w-none"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <CoverImage
                      src={n.image}
                      sizes="(min-width: 768px) 33vw, 78vw"
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-maroon-900/85 px-3 py-1 text-xs font-semibold capitalize text-gold-300 backdrop-blur">
                      {n.category}
                    </span>
                  </div>
                  <div className="p-5 sm:p-6">
                    <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <Icon name="calendar" size={14} /> {n.date}
                    </p>
                    <h3 className="mt-2.5 text-lg leading-snug group-hover:text-maroon-700 sm:text-xl">{n.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-6 sm:hidden">
              <Button href="/news" variant="outline" icon="arrow-right" className="w-full">View all news</Button>
            </div>
          </div>
        </section>
      ) : null}

      {/* Captured moments (gallery preview) */}
      {s.gallery !== false && albums.length ? (
        <section className="section bg-paper-dark">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow={galleryHeading.eyebrow} title={galleryHeading.title} intro={galleryHeading.intro} />
              <div className="hidden sm:block">
                <Button href="/gallery" variant="outline" icon="arrow-right">View gallery</Button>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-2.5 sm:gap-3 md:mt-12 md:grid-cols-3 lg:grid-cols-4">
              {albums.map((a, i) => (
                <Link
                  key={a.slug ?? a.title}
                  href={a.slug ? `/gallery/${a.slug}` : '/gallery'}
                  className={`group relative overflow-hidden rounded-2xl ${
                    i === 0 ? 'col-span-2 md:row-span-2' : ''
                  } ${
                    // Keep the mobile mosaic to whole rows — a lone orphan tile
                    // at the bottom is what makes a grid look unfinished.
                    i === 5 ? 'hidden md:block' : ''
                  }`}
                >
                  <div className={i === 0 ? 'relative aspect-[16/10] md:aspect-square' : 'relative aspect-square md:aspect-[4/3]'}>
                    <CoverImage
                      src={a.image}
                      alt={a.title}
                      sizes={i === 0 ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 768px) 25vw, 50vw'}
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-maroon-950/85 via-maroon-950/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-gold-300 sm:text-xs">{a.category}</p>
                    <h3 className="mt-0.5 line-clamp-1 text-sm font-semibold leading-snug !text-white sm:text-base">{a.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-6 sm:hidden">
              <Button href="/gallery" variant="outline" icon="arrow-right" className="w-full">View gallery</Button>
            </div>
          </div>
        </section>
      ) : null}

      {/* Testimonials */}
      {s.testimonials !== false && testimonials.items.length ? (
        <section className="section bg-maroon-950 text-white">
          <div className="container-page">
            <SectionHeading tone="dark" align="center" eyebrow={testimonials.eyebrow} title={testimonials.title} />
            <div className="rail mx-auto mt-9 max-w-4xl md:mt-14 md:grid-cols-2">
              {testimonials.items.map((t) => (
                <figure
                  key={t.name}
                  className="w-[82vw] max-w-[22rem] rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8 md:w-auto md:max-w-none"
                >
                  <span className="text-gold-400"><Icon name="quote" size={28} /></span>
                  <blockquote className="mt-3 font-display text-lg leading-relaxed text-paper sm:text-xl">{t.quote}</blockquote>
                  <figcaption className="mt-5 text-sm">
                    <span className="font-semibold text-white">{t.name}</span>
                    <span className="text-paper/60"> · {t.role}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Social feeds */}
      {s.feeds !== false ? (
        <section className="section">
          <div className="container-page">
            {/* The live site renders "Connect with us" twice because the fixed
                eyebrow and the editable heading happen to match — drop the
                eyebrow whenever they do. */}
            <SectionHeading
              align="center"
              eyebrow={
                feeds.heading.trim().toLowerCase() === 'connect with us' ? undefined : 'Connect with us'
              }
              title={feeds.heading || 'Follow us on social media'}
            />
            <div className="mt-8 md:mt-12">
              <SocialFeeds feeds={feeds} />
            </div>
          </div>
        </section>
      ) : null}

      {/* Visit / location */}
      {s.visit !== false ? (
      <section className="section bg-paper-dark">
        <div className="container-page grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <SectionHeading eyebrow={visit.eyebrow} title={visit.title} intro={visit.intro} />
            <dl className="mt-7 space-y-4 lg:mt-8">
              <div className="flex items-start gap-3">
                <span className="text-maroon-700"><Icon name="map-pin" size={22} /></span>
                <div>
                  <dt className="font-semibold text-ink">Campus</dt>
                  <dd className="text-sm text-ink-soft sm:text-base">
                    {address.line1}, {address.poBox}, {address.city}, {address.country}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-maroon-700"><Icon name="clock" size={22} /></span>
                <div>
                  <dt className="font-semibold text-ink">Office hours</dt>
                  <dd className="text-sm text-ink-soft sm:text-base">{visit.officeHours}</dd>
                </div>
              </div>
            </dl>
            {/* Directions is the action people actually want here, so it leads. */}
            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap lg:mt-8">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-maroon-700 px-5 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-maroon-800"
              >
                <Icon name="map-pin" size={18} /> Get Directions
              </a>
              <a
                href={waLink(contact.whatsapp, 'Hello, I would like to plan a visit to City Parents School.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-maroon-700/30 px-5 py-2.5 text-sm font-medium text-maroon-800 hover:bg-maroon-50"
              >
                <Icon name="whatsapp" size={18} /> WhatsApp
              </a>
              <Button href="/contact" variant="ghost" icon="arrow-right">Contact Us</Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line shadow-soft">
            <iframe
              title="City Parents School location map"
              className="h-[240px] w-full sm:h-[340px] lg:h-[420px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${config.coords.lat},${config.coords.lng}&z=16&output=embed`}
            />
          </div>
        </div>
      </section>
      ) : null}
    </>
  );
}
