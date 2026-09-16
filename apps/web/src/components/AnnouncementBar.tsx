import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { currentPath, deviceClass, getAnnouncements, showsOnPage } from '@/lib/announcements';

const styles: Record<string, string> = {
  INFO: 'bg-maroon-900 text-paper',
  WARNING: 'bg-gold-400 text-maroon-950',
  CRITICAL: 'bg-rose-700 text-white',
};

// Server component: the slim line of text above the header. Picture-only
// announcements are a band under the header instead (see AnnouncementBanner),
// because a poster has no words to put in a strip this thin.
export async function AnnouncementBar() {
  const items = await getAnnouncements();
  if (!items.length) return null;
  const pathname = await currentPath();
  const a = items.find((x) => x.layout !== 'image' && x.message?.trim() && showsOnPage(x, pathname));
  if (!a) return null;

  return (
    <div className={`${styles[a.severity] ?? styles.INFO} text-sm ${deviceClass(a.device)}`}>
      <div className="container-page flex items-center justify-center gap-3 py-2 text-center">
        <Icon name="megaphone" size={16} className="shrink-0" />
        <p className="font-medium">
          {a.message}
          {a.link ? (
            <Link href={a.link} className="ml-2 inline-flex items-center gap-1 underline underline-offset-2">
              {a.linkLabel || 'Learn more'} <Icon name="arrow-right" size={14} />
            </Link>
          ) : null}
        </p>
      </div>
    </div>
  );
}
