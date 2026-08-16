'use client';

import { useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { isVideoUrl } from '@/lib/media';
import { VideoPrepare } from '@/components/admin/VideoPrepare';

const inputCls =
  'w-full rounded-xl border border-line bg-white px-4 py-2.5 text-ink shadow-sm transition-colors placeholder:text-ink-muted focus:border-maroon-500 focus:outline-none focus:ring-2 focus:ring-maroon-500/20';

/**
 * Cloudinary requires every chunk except the last to be at least 5 MB; 20 MB is
 * what their own SDK uses. Files at or below this go up in a single request,
 * which is faster because there is no per-chunk round trip.
 */
const CHUNK_SIZE = 20 * 1024 * 1024;

/**
 * Largest single asset Cloudinary will accept on this account.
 *
 * Chunked upload removes the limit on one *request*, not the limit on a *file*:
 * the plan caps the finished asset, and the server replies "File size too large.
 * Got 178448147. Maximum is 104857600" only after the whole thing has been sent.
 * Checking first means a parent-sized video fails in a second with advice
 * instead of after a long upload with a number.
 */
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

type Signature = {
  enabled: boolean;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

type Json = Record<string, unknown>;

function authHeader(): Record<string, string> {
  const t = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/**
 * POST via XMLHttpRequest rather than fetch: fetch cannot report upload
 * progress, and a 300 MB video with no feedback looks like a frozen page.
 */
function xhrPost(
  url: string,
  body: FormData,
  headers: Record<string, string>,
  onProgress?: (loadedBytes: number) => void,
): Promise<Json> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded);
    };
    xhr.onload = () => {
      let data: Json = {};
      try { data = JSON.parse(xhr.responseText) as Json; } catch { /* not JSON (e.g. an nginx error page) */ }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
        return;
      }
      const err = data.error as { message?: string } | undefined;
      const message =
        err?.message ??
        (typeof data.message === 'string' ? data.message : undefined) ??
        (xhr.status === 413
          ? 'The file is larger than this Cloudinary plan allows for a single asset.'
          : `Upload failed (HTTP ${xhr.status}).`);
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error('Network error during upload. Check your connection and try again.'));
    xhr.onabort = () => reject(new Error('Upload cancelled.'));
    xhr.send(body);
  });
}

/** Asks the API for a signed permit. Returns null when uploads go via the server. */
async function getSignature(): Promise<Signature | null> {
  try {
    const res = await fetch('/api/media/signature', { method: 'POST', headers: authHeader() });
    if (!res.ok) return null;
    const data = (await res.json()) as Signature;
    return data?.enabled ? data : null;
  } catch {
    return null;
  }
}

/**
 * Browser → Cloudinary, in chunks when the file is large.
 *
 * Each chunk carries the same `X-Unique-Upload-Id` and a `Content-Range`, which
 * is how Cloudinary reassembles them; only the final chunk's response holds the
 * finished asset. This is what lifts the ceiling off large video uploads.
 */
async function uploadDirect(
  file: File,
  sig: Signature,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`;
  const baseForm = () => {
    const fd = new FormData();
    fd.append('api_key', sig.apiKey);
    fd.append('timestamp', String(sig.timestamp));
    fd.append('folder', sig.folder);
    fd.append('signature', sig.signature);
    return fd;
  };

  if (file.size <= CHUNK_SIZE) {
    const fd = baseForm();
    fd.append('file', file, file.name);
    const data = await xhrPost(url, fd, {}, (loaded) => onProgress?.(loaded / file.size));
    const out = (data.secure_url ?? data.url) as string | undefined;
    if (!out) throw new Error('Cloudinary accepted the file but returned no URL.');
    return out;
  }

  const uploadId = `cps-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let last: Json = {};
  for (let start = 0; start < file.size; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const fd = baseForm();
    fd.append('file', file.slice(start, end), file.name);
    const sent = start;
    last = await xhrPost(
      url,
      fd,
      {
        'X-Unique-Upload-Id': uploadId,
        'Content-Range': `bytes ${start}-${end - 1}/${file.size}`,
      },
      (loaded) => onProgress?.((sent + loaded) / file.size),
    );
  }
  const out = (last.secure_url ?? last.url) as string | undefined;
  if (!out) throw new Error('Cloudinary did not return a URL for the final chunk.');
  return out;
}

/** Fallback for R2 (or any setup without Cloudinary): via our own API. */
async function uploadViaServer(file: File, onProgress?: (fraction: number) => void): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const data = await xhrPost('/api/media/upload', fd, authHeader(), (loaded) =>
    onProgress?.(loaded / file.size),
  );
  const out = data.url as string | undefined;
  if (out) return out;
  throw new Error(typeof data.message === 'string' ? data.message : 'Upload failed.');
}

/**
 * Uploads a file and returns its public URL, or throws.
 * `onProgress` receives a 0-1 fraction of the bytes sent.
 */
export async function uploadFile(file: File, onProgress?: (fraction: number) => void): Promise<string> {
  const sig = await getSignature();
  if (!sig) return uploadViaServer(file, onProgress);

  try {
    return await uploadDirect(file, sig, onProgress);
  } catch (e) {
    // Safety net: the direct path is new and also carries the image uploads that
    // already worked. Anything small enough for the old route gets a second try
    // through it; a failed chunked upload is never committed, so this cannot
    // produce a duplicate asset. Large files keep the original error, which
    // explains the real limit rather than repeating a doomed attempt.
    if (file.size > 100 * 1024 * 1024) throw e;
    onProgress?.(0);
    try {
      return await uploadViaServer(file, onProgress);
    } catch {
      throw e;
    }
  }
}

/**
 * Upload a file and/or paste a URL. Both populate the same value, so it works
 * whether or not a storage provider is configured.
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
  const [pct, setPct] = useState(0);
  const [pending, setPending] = useState<{ name: string; size: number } | null>(null);
  const [oversize, setOversize] = useState<File | null>(null);
  const [error, setError] = useState('');

  async function upload(file: File) {
    if (file.size > MAX_UPLOAD_BYTES) {
      // A video can be trimmed and re-encoded here rather than sent away to be
      // compressed elsewhere; anything else can only be replaced by a smaller file.
      if (file.type.startsWith('video/')) {
        setError('');
        setOversize(file);
        return;
      }
      setError(
        `This file is ${formatBytes(file.size)}. The largest we can upload is ` +
          `${formatBytes(MAX_UPLOAD_BYTES)}, so please compress it and try again, or host it ` +
          `elsewhere and paste the link below.`,
      );
      return;
    }
    setOversize(null);
    setBusy(true);
    setError('');
    setPct(0);
    setPending({ name: file.name, size: file.size });
    try {
      onChange(await uploadFile(file, (f) => setPct(Math.round(f * 100))));
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
    setPending(null);
  }

  const isVideo = value ? isVideoUrl(value) : false;
  const isImage = !!value && !isVideo && (accept.startsWith('image') || /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(value));

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full border border-maroon-700/30 px-3.5 py-2 text-sm font-medium text-maroon-800 hover:bg-maroon-50 disabled:opacity-50"
        >
          <Icon name="download" size={16} className="rotate-180" /> {busy ? `Uploading… ${pct}%` : 'Upload'}
        </button>
        {pending ? (
          <span className="min-w-0 truncate text-xs text-ink-muted">
            {pending.name} · {formatBytes(pending.size)}
          </span>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = '';
          }}
        />
      </div>

      {busy ? (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-maroon-700 transition-[width] duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}

      <input
        type="url"
        value={value}
        placeholder="…or paste a URL"
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} mt-2`}
      />
      {error ? <p className="mt-1.5 text-xs leading-relaxed text-maroon-600">{error}</p> : null}

      {oversize ? (
        <VideoPrepare
          file={oversize}
          maxBytes={MAX_UPLOAD_BYTES}
          onCancel={() => setOversize(null)}
          onReady={(prepared) => { setOversize(null); void upload(prepared); }}
        />
      ) : null}

      {oversize ? (
        <VideoPrepare
          file={oversize}
          maxBytes={MAX_UPLOAD_BYTES}
          onCancel={() => setOversize(null)}
          onReady={(prepared) => { setOversize(null); void upload(prepared); }}
        />
      ) : null}

      {/* Show the actual file, not just its address. A URL alone gives no way to
          tell whether an upload replaced what was there before. */}
      {value && !busy ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-line bg-paper-dark/30">
          {isVideo ? (
            <video
              key={value}
              src={value}
              controls
              muted
              playsInline
              preload="metadata"
              className="block max-h-64 w-full bg-black object-contain"
            />
          ) : isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="block max-h-64 w-full object-contain" />
          ) : (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-maroon-700 hover:bg-maroon-50"
            >
              <Icon name="download" size={16} />
              Open uploaded file
            </a>
          )}
          <p className="truncate border-t border-line px-3 py-1.5 text-[0.7rem] text-ink-muted">{value}</p>
        </div>
      ) : null}
    </div>
  );
}
