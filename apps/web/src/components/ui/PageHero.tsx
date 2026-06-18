import Link from 'next/link';
import { Icon } from '@/components/Icon';

type Crumb = { label: string; href?: string };

export function PageHero({
  eyebrow,
  title,
  intro,
  crumbs = [],
  image,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  crumbs?: Crumb[];
  image?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-maroon-950 text-white">
      {image ? (
        <>
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url('${image}')` }}
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-br from-maroon-950 via-maroon-950/90 to-maroon-900/70"
          />
        </>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-maroon-950 to-maroon-800"
        />
      )}

      <div className="container-page py-20 lg:py-28">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-paper/60">
            <li>
              <Link href="/" className="hover:text-gold-300">Home</Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.label} className="flex items-center gap-2">
                <Icon name="chevron-right" size={14} className="text-paper/40" />
                {c.href ? (
                  <Link href={c.href} className="hover:text-gold-300">{c.label}</Link>
                ) : (
                  <span className="text-gold-300">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-8 max-w-3xl animate-rise">
          {eyebrow ? <span className="eyebrow !text-gold-300">{eyebrow}</span> : null}
          <h1 className="mt-4 text-4xl font-medium leading-[1.08] !text-white sm:text-5xl lg:text-[3.25rem]">
            {title}
          </h1>
          {intro ? (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/80">{intro}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
