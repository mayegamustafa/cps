import { headers } from 'next/headers';
import { serverApi } from '@/lib/api-base';

export type Announcement = {
  id: string;
  title?: string | null;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | string;
  link?: string | null;
  linkLabel?: string | null;
  imageUrl?: string | null;
  layout?: string | null; // card | image
  showInBanner?: boolean;
  popup?: boolean;
  audience?: string | null; // all | homepage | specific
  pages?: string[];
  device?: string | null; // all | mobile | desktop
};

/** Active announcements, or an empty list when the API cannot be reached. */
export async function getAnnouncements(): Promise<Announcement[]> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return [];
  try {
    const res = await fetch(`${serverApi()}/api/announcements`, {
      // Tagged so admin changes refresh it on demand (see /api/revalidate).
      next: { revalidate: 15, tags: ['site-settings'] },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    return (await res.json()) as Announcement[];
  } catch {
    return [];
  }
}

/** The page being rendered, put there by middleware. */
export async function currentPath(): Promise<string> {
  try {
    return (await headers()).get('x-pathname') || '/';
  } catch {
    return '/';
  }
}

/** Does this announcement belong on this page, and is it allowed on the page at all? */
export function showsOnPage(a: Announcement, pathname: string): boolean {
  if (a.showInBanner === false) return false;
  if (a.audience === 'homepage' && pathname !== '/') return false;
  if (a.audience === 'specific' && !(a.pages ?? []).some((p) => p && pathname.startsWith(p))) return false;
  return true;
}

/**
 * Phones and desktops are told apart in CSS rather than by sniffing the request,
 * so the same rendered page is correct on both and stays cacheable.
 */
export function deviceClass(device?: string | null): string {
  if (device === 'mobile') return 'lg:hidden';
  if (device === 'desktop') return 'hidden lg:block';
  return '';
}
