import type { Metadata } from 'next';
import { PageHero } from '@/components/ui/PageHero';
import { Icon } from '@/components/Icon';
import { downloads as fallbackDownloads } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Downloads Center',
  description:
    'Download the prospectus, application forms, fee structure, policies and the term calendar for City Parents School.',
};

type DownloadItem = {
  title: string;
  category: string;
  size: string;
  fileUrl?: string;
};

function formatSize(bytes?: number | null) {
  if (!bytes) return 'PDF';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

// Live documents from the API, falling back to bundled defaults when offline.
async function getDownloads(): Promise<DownloadItem[]> {
  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${API}/api/downloads`, { next: { revalidate: 60 } });
    if (!res.ok) return fallbackDownloads;
    const rows = (await res.json()) as Array<{
      title: string;
      category: string;
      fileUrl: string;
      fileSize?: number;
    }>;
    if (!Array.isArray(rows) || rows.length === 0) return fallbackDownloads;
    return rows.map((r) => ({
      title: r.title,
      category: r.category,
      size: formatSize(r.fileSize),
      fileUrl: r.fileUrl,
    }));
  } catch {
    return fallbackDownloads;
  }
}

export default async function DownloadsPage() {
  const items = await getDownloads();
  const categories = Array.from(new Set(items.map((d) => d.category)));

  return (
    <>
      <PageHero
        eyebrow="Downloads Center"
        title="Everything you need, in one place."
        intro="Access our prospectus, forms, policies and calendars. All documents are kept up to date for the current academic year."
        crumbs={[{ label: 'Downloads' }]}
      />

      <section className="py-24">
        <div className="container-page space-y-14">
          {categories.map((cat) => (
            <div key={cat}>
              <h2 className="flex items-center gap-3 text-2xl">
                <span className="h-px w-8 bg-gold-400" /> {cat}
              </h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {items
                  .filter((d) => d.category === cat)
                  .map((d) => (
                    <li key={d.title}>
                      <a
                        href={d.fileUrl ?? '#'}
                        className="group flex items-center gap-4 rounded-2xl border border-line bg-paper p-5 transition-all hover:border-maroon-700/30 hover:shadow-soft"
                      >
                        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-maroon-700">
                          <Icon name="book-open" size={22} />
                        </span>
                        <div className="flex-1">
                          <h3 className="text-base font-medium text-ink group-hover:text-maroon-700">{d.title}</h3>
                          <p className="text-sm text-ink-muted">PDF · {d.size}</p>
                        </div>
                        <span className="text-maroon-600"><Icon name="arrow-up-right" size={20} /></span>
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
