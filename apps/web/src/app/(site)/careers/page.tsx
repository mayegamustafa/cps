import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/ui/PageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Icon } from '@/components/Icon';
import { jobs } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Join the City Parents School team. Browse current teaching and non-teaching vacancies and apply online.',
};

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Build your career with City Parents."
        intro="We are always looking for passionate, talented educators and professionals to join our community. Explore our current openings."
        crumbs={[{ label: 'Careers' }]}
        image="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=2000&q=70"
      />

      {/* Why work with us */}
      <section className="py-24">
        <div className="container-page">
          <SectionHeading align="center" eyebrow="Why join us" title="A workplace that values its people" />
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: 'trophy', title: 'Professional growth', body: 'Continuous training and clear progression paths.' },
              { icon: 'heart-hand', title: 'Supportive culture', body: 'A collegial, respectful and inclusive environment.' },
              { icon: 'globe', title: 'Real impact', body: 'Shape the futures of thousands of young people.' },
              { icon: 'shield-check', title: 'Competitive benefits', body: 'Fair remuneration and staff welfare programmes.' },
            ].map((b) => (
              <div key={b.title} className="text-center">
                <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-100 text-maroon-700">
                  <Icon name={b.icon as 'trophy'} size={26} />
                </span>
                <h3 className="mt-5 text-lg">{b.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vacancies */}
      <section className="bg-paper-dark py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Open positions" title="Current vacancies" />
          <ul className="mt-12 space-y-4">
            {jobs.map((j) => (
              <li key={j.slug}>
                <Link
                  href={`/careers/${j.slug}`}
                  className="group flex flex-col gap-4 rounded-2xl border border-line bg-paper p-6 transition-all hover:border-maroon-700/30 hover:shadow-soft sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="text-xl group-hover:text-maroon-700">{j.title}</h3>
                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                      <span className="flex items-center gap-1.5"><Icon name="users" size={14} /> {j.department}</span>
                      <span className="flex items-center gap-1.5"><Icon name="clock" size={14} /> {j.type}</span>
                      <span className="flex items-center gap-1.5"><Icon name="calendar" size={14} /> Closes {new Date(j.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-maroon-700 px-5 py-2.5 text-sm font-medium text-white sm:self-center">
                    View & apply <Icon name="arrow-right" size={16} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
