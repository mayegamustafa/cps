import { PageHeader } from '@/components/admin/AdminUI';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { galleryAlbums } from '@/lib/content';

export default function AdminMediaPage() {
  return (
    <>
      <PageHeader
        title="Gallery & Media"
        subtitle="Upload photos and videos to Cloudflare R2 and organise albums."
        action={<Button href="#" icon="plus">Upload media</Button>}
      />

      {/* Upload dropzone */}
      <div className="mb-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-maroon-700/25 bg-maroon-50/40 py-12 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-maroon-700 text-white">
          <Icon name="image" size={24} />
        </span>
        <p className="mt-4 font-medium text-ink">Drag and drop files here</p>
        <p className="text-sm text-ink-muted">or click to browse, images and video up to 2 GB</p>
      </div>

      <h2 className="mb-3 font-display text-lg text-maroon-900">Albums</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {galleryAlbums.map((a) => (
          <div key={a.title} className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="aspect-[16/10] bg-cover bg-center" style={{ backgroundImage: `url('${a.image}')` }} />
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-ink">{a.title}</p>
                <p className="text-xs text-ink-muted">{a.category} · {a.count} items</p>
              </div>
              <div className="flex gap-1 text-ink-muted">
                <button aria-label="Edit album" className="rounded-lg p-1.5 hover:bg-maroon-50 hover:text-maroon-700"><Icon name="edit" size={17} /></button>
                <button aria-label="Delete album" className="rounded-lg p-1.5 hover:bg-rose-50 hover:text-rose-600"><Icon name="trash" size={17} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
