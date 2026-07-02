import Link from 'next/link';
import { Hero } from '@/components/sections/Hero';
import { StatsBand } from '@/components/sections/StatsBand';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { SocialFeeds } from '@/components/sections/SocialFeeds';
import { waLink } from '@/lib/site';
import { getSiteConfig } from '@/lib/site-config';
import { getStats } from '@/lib/stats';
import { getNews } from '@/lib/public-data';

export const revalidate = 30;

export default async function HomePage() {
  const config = await getSiteConfig();
  const stats = await getStats();
  const news = (await getNews()).slice(0, 3);
  const { welcome, pathways, why, admissionsCta, news: newsHeading, testimonials, visit, headTeacher: ht, feeds } = config.home;
  const { address, contact } = config;
  const s = config.sections;
  return (
    <>
      <Hero config={config} />
      <StatsBand stats={stats} />

      {/* Welcome */}
      {s.welcome !== false ? (
      <section className="py-24">
        <div className="container-page grid items-center gap-14 lg:grid-cols-2">
          <div className="relative">
            <div
              className="aspect-[4/5] w-full rounded-2xl bg-cover bg-center shadow-lift"
              style={{ backgroundImage: `url('${welcome.image}')` }}
            />
            {welcome.statValue ? (
              <div className="absolute -bottom-6 -right-2 hidden rounded-2xl border border-line bg-paper p-6 shadow-soft sm:block">
                <p className="font-display text-4xl text-maroon-700">{welcome.statValue}</p>
                <p className="mt-1 max-w-[10rem] text-sm text-ink-soft">{welcome.statLabel}</p>
              </div>
            ) : null}
          </div>

          <div>
            <SectionHeading eyebrow={welcome.eyebrow} title={welcome.title} intro={welcome.intro} />
            <ul className="mt-8 space-y-3">
              {welcome.bullets.map((point) => (
                <li key={point} className="flex items-start gap-3 text-ink-soft">
                  <span className="mt-1 text-maroon-600">
                    <Icon name="shield-check" size={20} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              {welcome.primaryCta.label ? <Button href={welcome.primaryCta.href} icon="arrow-right">{welcome.primaryCta.label}</Button> : null}
              {welcome.secondaryCta.label ? <Button href={welcome.secondaryCta.href} variant="outline">{welcome.secondaryCta.label}</Button> : null}
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {/* Head Teacher's message */}
      {s.headTeacher !== false && ht.message ? (
        <section className="bg-paper-dark py-24">
          <div className="container-page grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="mx-auto w-full max-w-xs">
              {ht.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ht.image} alt={ht.name} className="aspect-[4/5] w-full rounded-2xl object-cover shadow-lift" />
              ) : (
                <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-maroon-900 text-gold-300 shadow-lift">
                  <Icon name="graduation-cap" size={56} />
                </div>
              )}
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">{ht.eyebrow}</span>
              <blockquote className="mt-5 font-display text-2xl leading-relaxed text-maroon-900">
                <span className="text-gold-400"><Icon name="quote" size={30} /></span>
                <p className="mt-3">{ht.message}</p>
              </blockquote>
              <div className="mt-6">
                <p className="font-semibold text-ink">{ht.name}</p>
                <p className="text-sm text-ink-muted">{ht.title}</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Academic pathways */}
      {s.pathways !== false && pathways.items.length ? (
        <section className="bg-paper-dark py-24">
          <div className="container-page">
            <SectionHeading eyebrow={pathways.eyebrow} title={pathways.title} intro={pathways.intro} />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {pathways.items.map((p) => (
                <Link
                  key={p.name}
                  href={p.href}
                  className="group flex flex-col rounded-2xl border border-line bg-paper p-8 transition-all duration-300 hover:-translate-y-1 hover:border-maroon-700/30 hover:shadow-lift"
                >
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" aria-hidden className="h-16 w-16 rounded-xl object-cover" loading="lazy" />
                  ) : (
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-maroon-700 text-gold-300 transition-colors group-hover:bg-maroon-800">
                      <Icon name={p.icon} size={26} />
                    </span>
                  )}
                  <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">{p.age}</p>
                  <h3 className="mt-2 text-2xl">{p.name}</h3>
                  <p className="mt-3 flex-1 text-ink-soft">{p.blurb}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-maroon-700">
                    Explore programme
                    <Icon name="arrow-right" size={16} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Why choose us */}
      {s.why !== false && why.items.length ? (
        <section className="py-24">
          <div className="container-page">
            <SectionHeading align="center" eyebrow={why.eyebrow} title={why.title} />
            <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {why.items.map((v) => (
                <div key={v.title} className="flex gap-4">
                  <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-maroon-700">
                    <Icon name={v.icon} size={22} />
                  </span>
                  <div>
                    <h3 className="text-lg">{v.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{v.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Admissions CTA */}
      {s.admissionsCta !== false ? (
      <section className="py-12">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-maroon-900 px-8 py-16 text-white sm:px-16">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 opacity-20 bg-cover bg-center"
              style={{ backgroundImage: `url('${admissionsCta.image}')` }}
            />
            <div className="grid items-center gap-8 lg:grid-cols-[1.6fr_1fr]">
              <div>
                <span className="eyebrow !text-gold-300">{admissionsCta.eyebrow}</span>
                <h2 className="mt-4 max-w-2xl !text-white">{admissionsCta.title}</h2>
                <p className="mt-4 max-w-xl text-paper/80">{admissionsCta.intro}</p>
              </div>
              <div className="flex flex-col gap-3 lg:items-end">
                {admissionsCta.primaryCta.label ? (
                  <Button href={admissionsCta.primaryCta.href} variant="gold" size="lg" icon="arrow-right">
                    {admissionsCta.primaryCta.label}
                  </Button>
                ) : null}
                {admissionsCta.secondaryCta.label ? (
                  <Button
                    href={admissionsCta.secondaryCta.href}
                    size="lg"
                    className="border border-white/25 bg-transparent text-white hover:bg-white/10"
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

      {/* Latest news */}
      {s.news !== false && news.length ? (
        <section className="py-24">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow={newsHeading.eyebrow} title={newsHeading.title} />
              <Button href="/news" variant="outline" icon="arrow-right">View all news</Button>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {news.map((n) => (
                <Link
                  key={n.slug}
                  href={`/news/${n.slug}`}
                  className="group overflow-hidden rounded-2xl border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <div
                      className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url('${n.image}')` }}
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-maroon-900/85 px-3 py-1 text-xs font-semibold text-gold-300 backdrop-blur">
                      {n.category}
                    </span>
                  </div>
                  <div className="p-6">
                    <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <Icon name="calendar" size={14} /> {n.date}
                    </p>
                    <h3 className="mt-3 text-xl leading-snug group-hover:text-maroon-700">{n.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Testimonials */}
      {s.testimonials !== false && testimonials.items.length ? (
        <section className="bg-maroon-950 py-24 text-white">
          <div className="container-page">
            <SectionHeading tone="dark" align="center" eyebrow={testimonials.eyebrow} title={testimonials.title} />
            <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
              {testimonials.items.map((t) => (
                <figure key={t.name} className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                  <span className="text-gold-400"><Icon name="quote" size={32} /></span>
                  <blockquote className="mt-4 font-display text-xl leading-relaxed text-paper">{t.quote}</blockquote>
                  <figcaption className="mt-6 text-sm">
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
        <section className="py-24">
          <div className="container-page">
            <SectionHeading align="center" eyebrow="Connect with us" title={feeds.heading || 'Follow us on social media'} />
            <div className="mt-12">
              <SocialFeeds feeds={feeds} />
            </div>
          </div>
        </section>
      ) : null}

      {/* Visit / location */}
      {s.visit !== false ? (
      <section className="py-24">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow={visit.eyebrow} title={visit.title} intro={visit.intro} />
            <dl className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-maroon-700"><Icon name="map-pin" size={22} /></span>
                <div>
                  <dt className="font-semibold text-ink">Campus</dt>
                  <dd className="text-ink-soft">
                    {address.line1}, {address.poBox}, {address.city}, {address.country}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-maroon-700"><Icon name="clock" size={22} /></span>
                <div>
                  <dt className="font-semibold text-ink">Office hours</dt>
                  <dd className="text-ink-soft">{visit.officeHours}</dd>
                </div>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/contact" icon="arrow-right">Contact Us</Button>
              <a
                href={waLink(contact.whatsapp, 'Hello, I would like to plan a visit to City Parents School.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-maroon-700/30 px-5 py-2.5 text-sm font-medium text-maroon-800 hover:bg-maroon-50"
              >
                <Icon name="whatsapp" size={18} /> WhatsApp
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line shadow-soft">
            <iframe
              title="City Parents School location map"
              className="h-[420px] w-full"
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
