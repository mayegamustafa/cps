import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

// Static routes; dynamic content (news, events, galleries) is appended here
// from the API/DB once those endpoints are wired in.
const routes = [
  '',
  '/about',
  '/academics',
  '/admissions',
  '/news',
  '/gallery',
  '/careers',
  '/live',
  '/contact',
  '/alumni',
  '/downloads',
  '/virtual-tour',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return routes.map((path) => ({
    url: `${site.url}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
