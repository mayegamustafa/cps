import { serverApi } from './api-base';
import {
  events as fallbackEvents,
  galleryAlbums as fallbackAlbums,
  jobs as fallbackJobs,
  alumni as fallbackAlumni,
} from './content';

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=70';

// Server-side fetch with build-phase skip, timeout and graceful fallback.
async function get<T>(path: string, fallback: T[]): Promise<T[] | unknown[]> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return fallback;
  try {
    const res = await fetch(`${serverApi()}${path}`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    return Array.isArray(data) && data.length ? data : fallback;
  } catch {
    return fallback;
  }
}

export type NewsCard = { slug: string; title: string; excerpt: string; category: string; date: string; image: string };
const FALLBACK_NEWS: NewsCard[] = [
  { slug: 'national-examinations-2026', title: 'City Parents tops the district in national examinations', excerpt: 'Our candidates delivered the school’s best-ever results.', category: 'Achievement', date: 'May 12, 2026', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=70' },
  { slug: 'sports-gala-2026', title: 'Annual Sports Gala unites all four houses', excerpt: 'A day of athletics, spirit and friendly rivalry.', category: 'Events', date: 'Apr 28, 2026', image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=900&q=70' },
  { slug: 'science-block-opening', title: 'New science and innovation block opens', excerpt: 'State-of-the-art laboratories for hands-on learning.', category: 'Campus', date: 'Mar 15, 2026', image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=900&q=70' },
];

export async function getNews(): Promise<NewsCard[]> {
  const rows = (await get('/api/news', FALLBACK_NEWS)) as Record<string, unknown>[];
  if (rows === FALLBACK_NEWS) return FALLBACK_NEWS;
  return rows.map((r) => ({
    slug: String(r.slug),
    title: String(r.title),
    excerpt: String(r.excerpt ?? ''),
    category: Array.isArray(r.tags) && r.tags.length ? String(r.tags[0]) : 'News',
    date: r.publishedAt ? new Date(String(r.publishedAt)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    image: r.coverImage ? String(r.coverImage) : FALLBACK_IMG,
  }));
}

export type EventCard = { title: string; date: string; time: string; category: string; location: string };
export async function getEvents(): Promise<EventCard[]> {
  const rows = (await get('/api/events', fallbackEvents)) as Record<string, unknown>[];
  if (rows === (fallbackEvents as unknown)) return fallbackEvents as EventCard[];
  return rows.map((r) => {
    const d = r.startsAt ? new Date(String(r.startsAt)) : null;
    return {
      title: String(r.title),
      date: d ? d.toISOString() : '',
      time: d ? d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' }) : '',
      category: String(r.category ?? 'Event'),
      location: String(r.location ?? 'Main Campus'),
    };
  });
}

export type AlbumCard = { title: string; category: string; count: number; image: string };
export async function getAlbums(): Promise<AlbumCard[]> {
  const rows = (await get('/api/gallery', fallbackAlbums)) as Record<string, unknown>[];
  if (rows === (fallbackAlbums as unknown)) return fallbackAlbums as AlbumCard[];
  return rows.map((r) => ({
    title: String(r.title),
    category: String(r.category ?? 'Album'),
    count: 0,
    image: r.coverImage ? String(r.coverImage) : FALLBACK_IMG,
  }));
}

export type JobCard = { slug: string; title: string; department: string; type: string; deadline: string };
export async function getVacancies(): Promise<JobCard[]> {
  const rows = (await get('/api/careers/vacancies', fallbackJobs)) as Record<string, unknown>[];
  if (rows === (fallbackJobs as unknown)) return fallbackJobs as JobCard[];
  return rows.map((r) => ({
    slug: String(r.slug),
    title: String(r.title),
    department: String(r.department ?? ''),
    type: String(r.type ?? 'FULL_TIME').replace(/_/g, '-').toLowerCase(),
    deadline: r.deadline ? new Date(String(r.deadline)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Open',
  }));
}

export type AlumniCard = { name: string; year: number; role: string; org: string };
export async function getAlumni(): Promise<AlumniCard[]> {
  const rows = (await get('/api/alumni', fallbackAlumni)) as Record<string, unknown>[];
  if (rows === (fallbackAlumni as unknown)) return fallbackAlumni as AlumniCard[];
  return rows.map((r) => ({
    name: String(r.fullName ?? r.name ?? ''),
    year: Number(r.graduationYear ?? r.year ?? 0),
    role: String(r.currentRole ?? r.role ?? ''),
    org: String(r.organisation ?? r.org ?? ''),
  }));
}
