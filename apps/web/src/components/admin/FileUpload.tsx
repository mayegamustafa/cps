'use client';

import { useRef, useState } from 'react';
import { Icon } from '@/components/Icon';

const inputCls =
  'w-full rounded-xl border border-line bg-white px-4 py-2.5 text-ink shadow-sm transition-colors placeholder:text-ink-muted focus:border-maroon-500 focus:outline-none focus:ring-2 focus:ring-maroon-500/20';

/** Uploads a file to the server (R2) and returns its public URL, or throws. */
export async function uploadFile(file: File): Promise<string> {
  const token = sessionStorage.getItem('cps_token');
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/media/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data.url) return data.url as string;
  throw new Error(data.message ?? 'Upload failed.');
}

/**
 * Upload a file to the server (Cloudflare R2) and/or paste a URL.
 * Both populate the same value, so it works whether or not R2 is configured.
 */
export function FileUpload({
  label,
  value,
  onChange,
  accept = 'image/*',
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File) {
    setBusy(true);
    setError('');
    try {
      onChange(await uploadFile(file));
    } catch (e) {
      setError((e as Error).message + ' Paste a URL instead.');
    }
    setBusy(false);
  }

  const isImage = accept.startsWith('image');

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <div className="flex items-center gap-3">
        {value && isImage ? (
          <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line bg-cover bg-center" style={{ backgroundImage: `url('${value}')` }} />
        ) : null}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full border border-maroon-700/30 px-3.5 py-2 text-sm font-medium text-maroon-800 hover:bg-maroon-50 disabled:opacity-50"
        >
          <Icon name="download" size={16} className="rotate-180" /> {busy ? 'Uploading…' : 'Upload'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
      </div>
      <input
        type="url"
        value={value}
        placeholder="…or paste a URL"
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} mt-2`}
      />
      {error ? <p className="mt-1 text-xs text-maroon-600">{error}</p> : null}
    </div>
  );
}
