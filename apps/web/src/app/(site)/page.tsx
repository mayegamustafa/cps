import Link from 'next/link';
import { Hero } from '@/components/sections/Hero';
import { StatsBand } from '@/components/sections/StatsBand';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/Icon';
import { site } from '@/lib/site';
import { getSiteConfig } from '@/lib/site-config';
import { getStats } from '@/lib/stats';

const pathways: {
  name: string;
  icon: IconName;
  age: string;
  blurb: string;
  href: string;
}[] = [
  {
    name: 'Pre-Primary',
    icon: 'heart-hand',
    age: 'KG1 to KG3 · Ages 3 to 5',
    blurb:
      'A warm, play-rich foundation where curiosity, language and confidence take root.',
    href: '/academics#pre-primary',
  },
  {
    name: 'Lower Primary',
    icon: 'book-open',
    age: 'P.1 to P.3 · Ages 6 to 8',
    blurb:
      'The building blocks of formal learning, growing strong reading, writing and numeracy.',
    href: '/academics#lower-primary',
  },
  {
    name: 'Upper Primary',
    icon: 'graduation-cap',
    age: 'P.4 to P.7 · Ages 9 to 12',
    blurb:
      'Academic mastery and confidence, preparing pupils for the Primary Leaving Examinations.',
    href: '/academics#upper-primary',
  },
];

const values: { title: string; icon: IconName; body: string }[] = [
  {
    title: 'Academic Excellence',
    icon: 'trophy',
    body: 'Consistently among the top-performing schools in the region, with a record of national distinction.',
  },
  {
    title: 'Character & Values',
    icon: 'shield-check',
    body: 'Integrity, discipline and compassion are taught as deliberately as mathematics and science.',
  },
  {
    title: 'Global Outlook',
    icon: 'globe',
    body: 'Learners graduate as confident citizens prepared for universities and careers worldwide.',
  },
  {
    title: 'Creative & Co-curricular',
    icon: 'palette',
    body: 'Music, sport, debate and the arts give every child a stage to discover their talents.',
  },
  {
    title: 'Inquiry & Science',
    icon: 'flask',
    body: 'Modern laboratories and a question-led approach build genuine scientific thinking.',
  },
  {
    title: 'Vibrant Community',
    icon: 'users',
    body: 'A close partnership of teachers, parents and alumni surrounds every learner.',
  },
];

const news = [
  {
    title: 'City Parents tops the district in national examinations',
    category: 'Achievement',
    date: 'May 2026',
    href: '/news/national-examinations-2026',
    image:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=70',
  },
  {
    title: 'Annual Sports Gala unites all four houses on the field',
    category: 'Events',
    date: 'Apr 2026',
    href: '/news/sports-gala-2026',
    image:
      'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=900&q=70',
  },
  {
    title: 'New science and innovation block opens its doors',
    category: 'Campus',
    date: 'Mar 2026',
    href: '/news/science-block-opening',
    image:
      'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=900&q=70',
  },
];

const testimonials = [
  {
    quote:
      'The teachers know my daughter as an individual. She has grown in confidence and curiosity in ways we never expected.',
    name: 'Sarah N.',
    role: 'Parent, Primary',
  },
  {
    quote:
      'City Parents gave me the foundation and the values that carried me through university and into my career.',
    name: 'David K.',
    role: 'Alumnus, Class of 2012',
  },
];

export default async function HomePage() {
  const config = await getSiteConfig();
  const stats = await getStats();
  return (
    <>
      <Hero config={config} />
      <StatsBand stats={stats} />

      {/* Welcome */}
      <section className="py-24">
        <div className="container-page grid items-center gap-14 lg:grid-cols-2">
          <div className="relative">
            <div
              className="aspect-[4/5] w-full rounded-2xl bg-cover bg-center shadow-lift"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1000&q=70')",
              }}
            />
            <div className="absolute -bottom-6 -right-2 hidden rounded-2xl border border-line bg-paper p-6 shadow-soft sm:block">
              <p className="font-display text-4xl text-maroon-700">98%</p>
              <p className="mt-1 max-w-[10rem] text-sm text-ink-soft">
                of parents recommend us to other families
              </p>
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow="Welcome to City Parents"
              title="A school where every child is known, challenged and championed."
              intro="For three decades, City Parents School has been a home for ambitious learning in Kampala. We pair a demanding academic programme with genuine care, so that pupils leave us not only with results, but with character."
            />
            <ul className="mt-8 space-y-3">
              {[
                'Experienced, qualified and caring teaching staff',
                'A safe, modern campus on Kabaka Anjagala Road',
                'Strong pastoral care and house system',
              ].map((point) => (
                <li key={point} className="flex items-start gap-3 text-ink-soft">
                  <span className="mt-1 text-maroon-600">
                    <Icon name="shield-check" size={20} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button href="/about" icon="arrow-right">Our Story</Button>
              <Button href="/about#leadership" variant="outline">Meet the Leadership</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Academic pathways */}
      <section className="bg-paper-dark py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Academics"
            title="Three pathways. One standard of excellence."
            intro="A continuous, carefully-sequenced journey from the first day of Nursery to the final year of Secondary."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {pathways.map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className="group flex flex-col rounded-2xl border border-line bg-paper p-8 transition-all duration-300 hover:-translate-y-1 hover:border-maroon-700/30 hover:shadow-lift"
              >
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-maroon-700 text-gold-300 transition-colors group-hover:bg-maroon-800">
                  <Icon name={p.icon} size={26} />
                </span>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">
                  {p.age}
                </p>
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

      {/* Why choose us */}
      <section className="py-24">
        <div className="container-page">
          <SectionHeading
            align="center"
            eyebrow="Why City Parents"
            title="An education that lasts a lifetime."
          />
          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => (
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

      {/* Admissions CTA */}
      <section className="py-12">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-maroon-900 px-8 py-16 text-white sm:px-16">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 opacity-20 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1600&q=60')",
              }}
            />
            <div className="grid items-center gap-8 lg:grid-cols-[1.6fr_1fr]">
              <div>
                <span className="eyebrow !text-gold-300">Admissions 2026 / 2027</span>
                <h2 className="mt-4 max-w-2xl !text-white">
                  Applications are open. Give your child a head start.
                </h2>
                <p className="mt-4 max-w-xl text-paper/80">
                  Our online admissions portal makes it simple to apply, upload
                  documents and track your child&rsquo;s application from anywhere.
                </p>
              </div>
              <div className="flex flex-col gap-3 lg:items-end">
                <Button href="/admissions" variant="gold" size="lg" icon="arrow-right">
                  Start Application
                </Button>
                <Button
                  href="/downloads"
                  size="lg"
                  className="border border-white/25 bg-transparent text-white hover:bg-white/10"
                >
                  Download Prospectus
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest news */}
      <section className="py-24">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="News & Events"
              title="The latest from our community"
            />
            <Button href="/news" variant="outline" icon="arrow-right">View all news</Button>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {news.map((n) => (
              <Link
                key={n.href}
                href={n.href}
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
                  <h3 className="mt-3 text-xl leading-snug group-hover:text-maroon-700">
                    {n.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-maroon-950 py-24 text-white">
        <div className="container-page">
          <SectionHeading
            tone="dark"
            align="center"
            eyebrow="In their words"
            title="Trusted by families and alumni"
          />
          <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur"
              >
                <span className="text-gold-400">
                  <Icon name="quote" size={32} />
                </span>
                <blockquote className="mt-4 font-display text-xl leading-relaxed text-paper">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-6 text-sm">
                  <span className="font-semibold text-white">{t.name}</span>
                  <span className="text-paper/60"> · {t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Visit / location */}
      <section className="py-24">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Plan a visit"
              title="Come and see City Parents for yourself."
              intro="We warmly welcome prospective families to tour our campus, meet our teachers and experience the City Parents difference first-hand."
            />
            <dl className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-maroon-700"><Icon name="map-pin" size={22} /></span>
                <div>
                  <dt className="font-semibold text-ink">Campus</dt>
                  <dd className="text-ink-soft">
                    {site.address.line1}, {site.address.poBox}, {site.address.city}, {site.address.country}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-maroon-700"><Icon name="clock" size={22} /></span>
                <div>
                  <dt className="font-semibold text-ink">Office hours</dt>
                  <dd className="text-ink-soft">Monday to Friday, 8:00am to 5:00pm</dd>
                </div>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/contact" icon="arrow-right">Contact Us</Button>
              <a
                href={`https://wa.me/${site.contact.whatsapp}`}
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
              src={`https://www.google.com/maps?q=${site.coords.lat},${site.coords.lng}&z=16&output=embed`}
            />
          </div>
        </div>
      </section>
    </>
  );
}
