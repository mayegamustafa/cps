import Link from 'next/link';
import { Icon } from '@/components/Icon';

type Announcement = {
  id: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | string;
  link?: string | null;
};

const styles: Record<string, string> = {
  INFO: 'bg-maroon-900 text-paper',
  WARNING: 'bg-gold-400 text-maroon-950',
  CRITICAL: 'bg-rose-700 text-white',
};

// Server component: fetches the active announcement(s) for the site-wide banner.
export async function AnnouncementBar() {
  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001';
  let items: Announcement[] = [];
  try {
    const res = await fetch(`${API}/api/announcements`, { next: { revalidate: 30 } });
    if (res.ok) items = await res.json();
  } catch {
    return null;
  }
  if (!items.length) return null;
  const a = items[0];

  return (
    <div className={`${styles[a.severity] ?? styles.INFO} text-sm`}>
      <div className="container-page flex items-center justify-center gap-3 py-2 text-center">
        <Icon name="megaphone" size={16} className="shrink-0" />
        <p className="font-medium">
          {a.message}
          {a.link ? (
            <Link href={a.link} className="ml-2 inline-flex items-center gap-1 underline underline-offset-2">
              Learn more <Icon name="arrow-right" size={14} />
            </Link>
          ) : null}
        </p>
      </div>
    </div>
  );
}
