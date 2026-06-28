import type { Metadata } from 'next';
import { assertPageEnabled } from '@/lib/page-guard';
import { ConfigurablePageHero } from '@/components/ui/ConfigurablePageHero';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';

export const metadata: Metadata = {
  title: 'Live TV',
  description:
    'City Parents School Live TV — assemblies, sports, graduations and special events, streamed to families wherever they are. Launching soon.',
};

export default async function LivePage() {
  await assertPageEnabled('live');

  return (
    <>
      <ConfigurablePageHero page="live"
        eyebrow="City Parents Live"
        title="Be there, wherever you are."
        intro="Our school streaming platform will bring assemblies, sports days, graduations and special events directly to your screen — live and on demand."
        crumbs={[{ label: 'Live TV' }]}
      />

      <section className="py-24">
        <div className="container-page">
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-line bg-maroon-950 px-8 py-16 text-center text-white sm:px-16">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-maroon-900/50 to-maroon-950" />
            <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-gold-300 ring-1 ring-white/15">
              <Icon name="video" size={30} />
            </span>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-gold-300">Coming soon</p>
            <h2 className="mt-3 font-display text-3xl !text-white sm:text-4xl">Live TV is on its way</h2>
            <p className="mx-auto mt-4 max-w-xl text-paper/75">
              We&rsquo;re building a premium live-streaming experience so parents, alumni and friends of
              City Parents can watch our biggest moments in real time — and catch every recording afterwards.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button href="/news" variant="gold" size="lg" icon="arrow-right">See what&rsquo;s happening</Button>
              <Button href="/contact" size="lg" className="border border-white/25 bg-transparent text-white hover:bg-white/10">
                Contact us
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
