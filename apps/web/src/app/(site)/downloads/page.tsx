import type { Metadata } from 'next';
import { assertPageEnabled } from '@/lib/page-guard';
import { ConfigurablePageHero } from '@/components/ui/ConfigurablePageHero';
import { DownloadsList, type DownloadItem } from '@/components/DownloadsList';
import { getSiteConfig } from '@/lib/site-config';
import { downloads as fallbackDownloads } from '@/lib/content';
import { serverApi } from '@/lib/api-base';

export const metadata: Metadata = {
  title: 'Downloads Center',
  description:
    'Download the prospectus, application forms, fee structure, policies and the term calendar for City Parents School.',
};

function formatSize(bytes?: number | null) {
  if (!bytes) return 'PDF';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

// Live documents from the API, falling back to bundled defaults when offline.
async function getDownloads(): Promise<DownloadItem[]> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return fallbackDownloads;
  const API = serverApi();
  try {
    const res = await fetch(`${API}/api/downloads`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    });
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
  await assertPageEnabled('downloads');
  const items = await getDownloads();
  const config = await getSiteConfig();

  return (
    <>
      <ConfigurablePageHero page="downloads"
        eyebrow="Downloads Center"
        title="Everything you need, in one place."
        intro="Access our prospectus, forms, policies and calendars. All documents are kept up to date for the current academic year."
        crumbs={[{ label: 'Downloads' }]}
      />

      <section className="section">
        <div className="container-page">
          <DownloadsList
            items={items}
            phone={config.contact.phone}
            whatsapp={config.contact.whatsapp}
          />
        </div>
      </section>
    </>
  );
}
