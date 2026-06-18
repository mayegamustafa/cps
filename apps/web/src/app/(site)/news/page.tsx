import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/ui/PageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Icon } from '@/components/Icon';
import { events } from '@/lib/content';

export const metadata: Metadata = {
  title: 'News & Events',
  description:
    'The latest news, announcements and the upcoming events calendar at City Parents School.',
};

const articles = [
  { slug: 'national-examinations-2026', title: 'City Parents tops the district in national examinations', excerpt: 'Our candidates delivered the school’s best-ever results, with distinctions across the board.', category: 'Achievement', date: 'May 12, 2026', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=70' },
  { slug: 'sports-gala-2026', title: 'Annual Sports Gala unites all four houses', excerpt: 'A day of athletics, spirit and friendly rivalry on the school field.', category: 'Events', date: 'Apr 28, 2026', image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=900&q=70' },
  { slug: 'science-block-opening', title: 'New science and innovation block opens', excerpt: 'State-of-the-art laboratories expand our capacity for hands-on learning.', category: 'Campus', date: 'Mar 15, 2026', image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=900&q=70' },
  { slug: 'debate-champions', title: 'Debate team crowned national champions', excerpt: 'Our senior debaters argued their way to a national title in Kampala.', category: 'Achievement', date: 'Feb 20, 2026', image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=900&q=70' },
  { slug: 'community-outreach', title: 'Pupils lead community clean-up drive', excerpt: 'Service learning in action as our students give back to the neighbourhood.', category: 'Community', date: 'Feb 02, 2026', image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=70' },
  { slug: 'music-festival', title: 'Inter-house music festival delights families', excerpt: 'An evening of choral and instrumental brilliance from every house.', category: 'Arts', date: 'Jan 18, 2026', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=900&q=70' },
];

const monthName = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();

export default function NewsPage() {
  return (
    <>
      <PageHero
        eyebrow="News & Events"
        title="What’s happening at City Parents."
        intro="Celebrate our achievements, follow campus stories and never miss an upcoming event."
        crumbs={[{ label: 'News & Events' }]}
        image="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=2000&q=70"
      />

      {/* News grid */}
      <section className="py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Latest news" title="From our newsroom" />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.slug}
                href={`/news/${a.slug}`}
                className="group overflow-hidden rounded-2xl border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <div className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${a.image}')` }} />
                  <span className="absolute left-4 top-4 rounded-full bg-maroon-900/85 px-3 py-1 text-xs font-semibold text-gold-300 backdrop-blur">{a.category}</span>
                </div>
                <div className="p-6">
                  <p className="flex items-center gap-1.5 text-xs text-ink-muted"><Icon name="calendar" size={14} /> {a.date}</p>
                  <h3 className="mt-3 text-xl leading-snug group-hover:text-maroon-700">{a.title}</h3>
                  <p className="mt-2 text-sm text-ink-soft">{a.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Events calendar */}
      <section className="bg-paper-dark py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Upcoming" title="Events calendar" intro="Mark your diary and register for the events that matter to your family." />
          <ul className="mt-12 space-y-3">
            {events.map((e) => (
              <li key={e.title} className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-5 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-maroon-700 text-white">
                  <span className="font-display text-2xl leading-none">{new Date(e.date).getDate()}</span>
                  <span className="text-xs font-semibold text-gold-300">{monthName(e.date)}</span>
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gold-600">{e.category}</span>
                  <h3 className="text-lg">{e.title}</h3>
                  <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                    <span className="flex items-center gap-1.5"><Icon name="clock" size={14} /> {e.time}</span>
                    <span className="flex items-center gap-1.5"><Icon name="map-pin" size={14} /> {e.location}</span>
                  </p>
                </div>
                <Link href="/contact" className="inline-flex items-center gap-1.5 rounded-full border border-maroon-700/30 px-5 py-2.5 text-sm font-medium text-maroon-800 hover:bg-maroon-50">
                  Register <Icon name="arrow-right" size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
