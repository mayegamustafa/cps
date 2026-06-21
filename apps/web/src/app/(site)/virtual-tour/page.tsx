import type { Metadata } from 'next';
import { ConfigurablePageHero } from '@/components/ui/ConfigurablePageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';

export const metadata: Metadata = {
  title: 'Virtual Tour',
  description:
    'Explore the City Parents School campus from anywhere with our immersive 360° virtual tour.',
};

const stops = [
  { title: 'Main Entrance & Reception', image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=900&q=70' },
  { title: 'Classrooms & Learning Spaces', image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=70' },
  { title: 'Science & Innovation Block', image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=900&q=70' },
  { title: 'Library & Resource Centre', image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=70' },
  { title: 'Sports Fields & Courts', image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=900&q=70' },
  { title: 'Dining Hall & Boarding', image: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=900&q=70' },
];

export default function VirtualTourPage() {
  return (
    <>
      <ConfigurablePageHero page="virtual-tour"
        eyebrow="Virtual Tour"
        title="Walk our campus from anywhere."
        intro="Take an immersive 360° tour of City Parents School, explore our classrooms, laboratories, library, sports facilities and more, all from your device."
        crumbs={[{ label: 'Virtual Tour' }]}
      />

      {/* 360 viewer */}
      <section className="py-16">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-2xl border border-line">
            <div
              className="flex aspect-[16/9] items-center justify-center bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2000&q=70')" }}
            >
              <button className="group flex flex-col items-center gap-3 rounded-2xl bg-maroon-950/40 px-10 py-8 text-white backdrop-blur-sm transition-colors hover:bg-maroon-950/55">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold-400 text-maroon-900 transition-transform group-hover:scale-105">
                  <Icon name="play" size={30} />
                </span>
                <span className="font-display text-xl">Launch 360° tour</span>
              </button>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-ink-muted">
            Drag to look around · Click hotspots to move between locations
          </p>
        </div>
      </section>

      {/* Tour stops */}
      <section className="bg-paper-dark py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Explore" title="Tour highlights" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stops.map((s) => (
              <button key={s.title} className="group relative aspect-[4/3] overflow-hidden rounded-2xl text-left">
                <div className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${s.image}')` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/85 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5 text-white">
                  <h3 className="text-lg !text-white">{s.title}</h3>
                  <span className="text-gold-300"><Icon name="arrow-up-right" size={20} /></span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container-page text-center">
          <SectionHeading align="center" eyebrow="Prefer to visit in person?" title="Book a guided campus tour" />
          <div className="mt-8 flex justify-center gap-3">
            <Button href="/contact" size="lg" icon="arrow-right">Schedule a visit</Button>
            <Button href="/admissions" variant="outline" size="lg">Start application</Button>
          </div>
        </div>
      </section>
    </>
  );
}
