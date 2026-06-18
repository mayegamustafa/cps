import type { Metadata } from 'next';
import { PageHero } from '@/components/ui/PageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { departments, boardingOptions } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Academics',
  description:
    'Kindergarten (KG1 to KG3) and Primary (P.1 to P.7) programmes, day and boarding sections, curriculum and learning resources at City Parents School.',
};

export default function AcademicsPage() {
  return (
    <>
      <PageHero
        eyebrow="Academics"
        title="A continuous journey of discovery and excellence."
        intro="From the first day of Kindergarten to the final year of Primary, our curriculum is carefully sequenced to build knowledge, skills and character at every stage."
        crumbs={[{ label: 'Academics' }]}
        image="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=2000&q=70"
      />

      {departments.map((d, i) => (
        <section
          key={d.section}
          id={d.section.toLowerCase().replace(/\s+/g, '-')}
          className={i % 2 === 1 ? 'bg-paper-dark py-24' : 'py-24'}
        >
          <div className="container-page grid items-center gap-14 lg:grid-cols-2">
            <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-maroon-700 text-gold-300">
                <Icon name={d.icon} size={28} />
              </span>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">
                {d.age}
              </p>
              <h2 className="mt-2 text-3xl sm:text-4xl">{d.section}</h2>
              <p className="mt-4 text-lg text-ink-soft">{d.summary}</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {d.subjects.map((s) => (
                  <li key={s} className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm text-ink-soft">
                    {s}
                  </li>
                ))}
              </ul>
              <Button href="/admissions" className="mt-8" icon="arrow-right">
                Apply for {d.section}
              </Button>
            </div>
            <div
              className={`aspect-[4/3] rounded-2xl bg-cover bg-center shadow-lift ${i % 2 === 1 ? 'lg:order-1' : ''}`}
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-${
                  ['1503454537195-1dcabb73ffb9', '1546410531-bb4caa6b424d', '1523240795612-9a054b0db644'][i]
                }?auto=format&fit=crop&w=1000&q=70')`,
              }}
            />
          </div>
        </section>
      ))}

      {/* Day & Boarding */}
      <section id="day-boarding" className="bg-paper-dark py-24">
        <div className="container-page">
          <SectionHeading
            align="center"
            eyebrow="Day & Boarding"
            title="Two ways to belong at City Parents"
            intro="Every family chooses the arrangement that suits them best, with the same standard of care and academic excellence in both."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {boardingOptions.map((o) => (
              <div key={o.name} className="rounded-2xl border border-line bg-paper p-8">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-maroon-700 text-gold-300">
                  <Icon name={o.icon} size={28} />
                </span>
                <h3 className="mt-6 text-2xl">{o.name}</h3>
                <p className="mt-3 text-ink-soft">{o.summary}</p>
                <ul className="mt-5 space-y-2">
                  {o.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-ink-soft">
                      <Icon name="shield-check" size={18} className="text-maroon-600" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning resources */}
      <section className="bg-maroon-950 py-24 text-white">
        <div className="container-page">
          <SectionHeading tone="dark" align="center" eyebrow="Beyond the classroom" title="Resources that bring learning to life" />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: 'flask', title: 'Science Laboratories', body: 'Modern physics, chemistry and biology labs.' },
              { icon: 'book-open', title: 'Library & Resource Centre', body: 'Thousands of titles and digital resources.' },
              { icon: 'palette', title: 'Arts & Music Studios', body: 'Spaces for creativity, performance and design.' },
              { icon: 'trophy', title: 'Sports Facilities', body: 'Fields, courts and a vibrant house system.' },
            ].map((r) => (
              <div key={r.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <span className="text-gold-300"><Icon name={r.icon as 'flask'} size={28} /></span>
                <h3 className="mt-4 text-lg !text-white">{r.title}</h3>
                <p className="mt-2 text-sm text-paper/70">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
