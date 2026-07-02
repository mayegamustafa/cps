import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { serverApi } from '@/lib/api-base';

// Regenerate at runtime (hourly) so newly-published news and gallery albums —
// and their photos — get into the sitemap without a redeploy. At build time
// the API isn't reachable, so we emit the static routes and fill in the
// dynamic (image-bearing) entries on the first runtime render.
export const revalidate = 3600;

const staticRoutes = [
  '',
  '/about',
  '/academics',
  '/admissions',
  '/news',
  '/gallery',
  '/careers',
  '/talent',
  '/live',
  '/contact',
  '/alumni',
  '/downloads',
  '/virtual-tour',
];

async function fetchJson(path: string): Promise<Record<string, unknown>[]> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return [];
  try {
    const res = await fetch(`${serverApi()}${path}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

/** Pull image URLs out of a gallery album's `images` (strings or {url}). */
function albumImages(a: Record<string, unknown>): string[] {
  const out: string[] = [];
  if (a.coverImage) out.push(String(a.coverImage));
  if (Array.isArray(a.images)) {
    for (const im of a.images) {
      if (typeof im === 'string') out.push(im);
      else if (im && typeof im === 'object' && 'url' in im) out.push(String((im as { url: unknown }).url));
    }
  }
  return out.filter(Boolean);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base = site.url.replace(/\/+$/, '');

  const entries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  // News articles — include the cover image so it can be indexed in Google Images.
  const news = await fetchJson('/api/news');
  for (const n of news) {
    if (!n.slug) continue;
    const cover = n.coverImage ? [String(n.coverImage)] : undefined;
    entries.push({
      url: `${base}/news/${String(n.slug)}`,
      lastModified: n.publishedAt ? new Date(String(n.publishedAt)) : now,
      changeFrequency: 'monthly',
      priority: 0.6,
      images: cover,
    });
  }

  // Gallery albums — include every photo in the album for image indexing.
  const albums = await fetchJson('/api/gallery');
  for (const a of albums) {
    if (!a.slug) continue;
    const imgs = albumImages(a);
    entries.push({
      url: `${base}/gallery/${String(a.slug)}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
      images: imgs.length ? imgs : undefined,
    });
  }

  return entries;
}
