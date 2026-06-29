import type { Metadata } from 'next';
import { ConfigurablePageHero } from '@/components/ui/ConfigurablePageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Icon, type IconName } from '@/components/Icon';
import { getSiteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'About School',
  description:
    'The history, vision, mission, values and leadership behind City Parents School, Kampala.',
};

export default async function AboutPage() {
  const { about } = await getSiteConfig();
  const { story, vision, mission, values, leadership } = about;
  return (
    <>
      <ConfigurablePageHero page="about"
        eyebrow="About City Parents"
        title="Three decades of shaping Uganda’s future leaders."
        intro="Founded in 1994, City Parents School has grown into one of Kampala’s most respected institutions, a place where academic ambition meets genuine care."
        crumbs={[{ label: 'About' }]}
        image="https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=2000&q=70"
      />

      {/* Story */}
      <section className="py-24">
        <div className="container-page grid items-center gap-14 lg:grid-cols-2">
          <div
            className="aspect-[4/3] rounded-2xl bg-cover bg-center shadow-lift"
            style={{ backgroundImage: `url('${story.image}')` }}
          />
          <div>
            <SectionHeading eyebrow={story.eyebrow} title={story.title} intro={story.intro} />
            {story.body ? <p className="mt-5 text-ink-soft">{story.body}</p> : null}
          </div>
        </div>
      </section>

      {/* Vision / Mission */}
      <section className="bg-paper-dark py-24">
        <div className="container-page grid gap-6 md:grid-cols-2">
          {[
            { icon: 'globe' as IconName, title: vision.title, body: vision.body },
            { icon: 'graduation-cap' as IconName, title: mission.title, body: mission.body },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-line bg-paper p-8">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-maroon-700 text-gold-300">
                <Icon name={c.icon} size={26} />
              </span>
              <h2 className="mt-6 text-2xl">{c.title}</h2>
              <p className="mt-3 text-ink-soft">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-24">
        <div className="container-page">
          <SectionHeading align="center" eyebrow="What we stand for" title="Our core values" />
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="text-center">
                <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-100 text-maroon-700">
                  <Icon name={v.icon} size={26} />
                </span>
                <h3 className="mt-5 text-xl">{v.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section id="leadership" className="bg-maroon-950 py-24 text-white">
        <div className="container-page">
          <SectionHeading tone="dark" eyebrow="Leadership" title="Meet the people who lead our school" />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {leadership.map((p) => (
              <div key={p.name} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-gold-400/40" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-400 font-display text-2xl text-maroon-900">
                    {p.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                )}
                <h3 className="mt-5 text-lg !text-white">{p.name}</h3>
                <p className="text-sm font-semibold text-gold-300">{p.title}</p>
                <p className="mt-3 text-sm text-paper/70">{p.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
