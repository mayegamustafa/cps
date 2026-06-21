import { PageHero } from './PageHero';
import { getSiteConfig } from '@/lib/site-config';
import type { PageHeadKey } from '@/lib/site';

type Crumb = { label: string; href?: string };

/**
 * Server-side wrapper around PageHero driven by admin settings.
 * Reads `pageHeads[page]` from the live config: the admin can hide the banner
 * (show=false → renders nothing) or override its eyebrow/title/intro/image.
 * The props passed here are sensible per-page fallbacks.
 */
export async function ConfigurablePageHero({
  page,
  eyebrow,
  title,
  intro,
  image,
  crumbs = [],
}: {
  page: PageHeadKey;
  eyebrow?: string;
  title: string;
  intro?: string;
  image?: string;
  crumbs?: Crumb[];
}) {
  const config = await getSiteConfig();
  const cfg = config.pageHeads?.[page];
  if (cfg && cfg.show === false) return null;
  return (
    <PageHero
      eyebrow={cfg?.eyebrow ?? eyebrow}
      title={cfg?.title || title}
      intro={cfg?.intro ?? intro}
      image={cfg?.image || image}
      crumbs={crumbs}
    />
  );
}
