import type { Metadata } from 'next';
import { ConfigurablePageHero } from '@/components/ui/ConfigurablePageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { getSiteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Academics',
  description:
    'Kindergarten (KG1 to KG3) and Primary (P.1 to P.7) programmes, day and boarding sections, curriculum and learning resources at City Parents School.',
};

export default async function AcademicsPage() {
  const { academics } = await getSiteConfig();
  const { stages, dayBoarding, resources } = academics;

  return (
    <>
      <ConfigurablePageHero page="academics"
        eyebrow="Academics"
        title="A continuous journey of discovery and excellence."
        intro="From the first day of Kindergarten to the final year of Primary, our curriculum is carefully sequenced to build knowledge, skills and character at every stage."
        crumbs={[{ label: 'Academics' }]}
        image="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=2000&q=70"
      />

      {stages.map((d, i) => (
        <section
          key={d.name}
          id={d.name.toLowerCase().replace(/\s+/g, '-')}
          className={i % 2 === 1 ? 'bg-paper-dark py-24' : 'py-24'}
        >
          <div className="container-page grid items-center gap-14 lg:grid-cols-2">
            <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
              {!d.image ? (
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-maroon-700 text-gold-300">
                  <Icon name={d.icon} size={28} />
                </span>
              ) : null}
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">
                {d.age}
              </p>
              <h2 className="mt-2 text-3xl sm:text-4xl">{d.name}</h2>
              <p className="mt-4 text-lg text-ink-soft">{d.summary}</p>
              {d.subjects.length ? (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {d.subjects.map((s) => (
                    <li key={s} className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm text-ink-soft">
                      {s}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Button href={d.href || '/admissions'} className="mt-8" icon="arrow-right">
                Apply for {d.name}
              </Button>
            </div>
            <div
              className={`aspect-[4/3] rounded-2xl bg-cover bg-center shadow-lift ${i % 2 === 1 ? 'lg:order-1' : ''}`}
              style={{
                backgroundImage: `url('${
                  d.image ||
                  `https://images.unsplash.com/photo-${
                    ['1503454537195-1dcabb73ffb9', '1546410531-bb4caa6b424d', '1523240795612-9a054b0db644'][i % 3]
                  }?auto=format&fit=crop&w=1000&q=70`
                }')`,
              }}
            />
          </div>
        </section>
      ))}

      {/* Day & Boarding */}
      {dayBoarding.options.length ? (
        <section id="day-boarding" className="bg-paper-dark py-24">
          <div className="container-page">
            <SectionHeading
              align="center"
              eyebrow={dayBoarding.eyebrow}
              title={dayBoarding.title}
              intro={dayBoarding.intro}
            />
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {dayBoarding.options.map((o) => (
                <div key={o.name} className="rounded-2xl border border-line bg-paper p-8">
                  {o.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.image} alt="" aria-hidden className="h-16 w-16 rounded-xl object-cover" loading="lazy" />
                  ) : (
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-maroon-700 text-gold-300">
                      <Icon name={o.icon} size={28} />
                    </span>
                  )}
                  <h3 className="mt-6 text-2xl">{o.name}</h3>
                  <p className="mt-3 text-ink-soft">{o.summary}</p>
                  {o.features.length ? (
                    <ul className="mt-5 space-y-2">
                      {o.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-sm text-ink-soft">
                          <Icon name="shield-check" size={18} className="text-maroon-600" /> {f}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Learning resources */}
      {resources.items.length ? (
        <section className="bg-maroon-950 py-24 text-white">
          <div className="container-page">
            <SectionHeading tone="dark" align="center" eyebrow={resources.eyebrow} title={resources.title} />
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {resources.items.map((r) => (
                <div key={r.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  {r.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image} alt="" aria-hidden className="h-12 w-12 rounded-lg object-cover" loading="lazy" />
                  ) : (
                    <span className="text-gold-300"><Icon name={r.icon} size={28} /></span>
                  )}
                  <h3 className="mt-4 text-lg !text-white">{r.title}</h3>
                  <p className="mt-2 text-sm text-paper/70">{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
