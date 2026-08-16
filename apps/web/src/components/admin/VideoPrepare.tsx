'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/ui/Button';

/**
 * Shrinks an oversized video in the browser so it fits the upload limit.
 *
 * The limit is Cloudinary's cap on a finished asset, so it cannot be raised from
 * here and a large file has to become a smaller one before it is sent. The work
 * is done with the APIs every current browser already has: the video is drawn
 * frame by frame into a canvas at a lower resolution, its audio is routed
 * through Web Audio, and MediaRecorder re-encodes the result at a chosen
 * bitrate. No library, nothing uploaded until the operator approves the result.
 *
 * Encoding runs at playback speed, so a five minute clip takes five minutes.
 * Trimming is offered first because it is both the faster fix and usually the
 * better one: nobody watches a five minute tour that starts on its own.
 */

const QUALITY = [
  { key: '1080p', label: '1080p, sharpest', height: 1080, bitrate: 4_000_000 },
  { key: '720p', label: '720p, recommended', height: 720, bitrate: 2_200_000 },
  { key: '480p', label: '480p, smallest', height: 480, bitrate: 1_100_000 },
] as const;

type QualityKey = (typeof QUALITY)[number]['key'];

function fmtBytes(b: number): string {
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function fmtTime(s: number): string {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function once(target: EventTarget, event: string): Promise<void> {
  return new Promise((resolve) => target.addEventListener(event, () => resolve(), { once: true }));
}

/** The best container this browser can actually record. */
function pickMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
  }
  return '';
}

export function VideoPrepare({
  file,
  maxBytes,
  onReady,
  onCancel,
}: {
  file: File;
  maxBytes: number;
  onReady: (file: File) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [url] = useState(() => URL.createObjectURL(file));
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [quality, setQuality] = useState<QualityKey>('720p');
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const preset = QUALITY.find((q) => q.key === quality) as (typeof QUALITY)[number];
  const span = Math.max(0, end - start);
  // Bitrate times duration, plus a little for audio and container overhead.
  const estimate = Math.round((preset.bitrate / 8) * span * 1.08);
  const fits = estimate > 0 && estimate <= maxBytes;
  const supported = typeof MediaRecorder !== 'undefined' && !!pickMimeType();

  async function prepare() {
    const v = videoRef.current;
    if (!v || span <= 0) return;
    setBusy(true);
    setError('');
    setPct(0);

    let audioCtx: AudioContext | null = null;
    let raf = 0;
    try {
      const mimeType = pickMimeType();
      const scale = Math.min(1, preset.height / (v.videoHeight || preset.height));
      // Even dimensions keep every encoder happy.
      const w = Math.max(2, Math.round((v.videoWidth * scale) / 2) * 2);
      const h = Math.max(2, Math.round((v.videoHeight * scale) / 2) * 2);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('This browser cannot process video here.');

      const stream = canvas.captureStream(30);

      // Route audio through Web Audio rather than the speakers, so the page
      // stays silent while the clip is being read.
      try {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new Ctor();
        const source = audioCtx.createMediaElementSource(v);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        for (const track of dest.stream.getAudioTracks()) stream.addTrack(track);
      } catch {
        // No audio track: the tour plays muted anyway, so this is survivable.
        audioCtx = null;
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: preset.bitrate,
      });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

      v.currentTime = start;
      await once(v, 'seeked');
      recorder.start(1000);
      await v.play();

      const draw = () => {
        ctx.drawImage(v, 0, 0, w, h);
        raf = requestAnimationFrame(draw);
      };
      draw();

      await new Promise<void>((resolve) => {
        const tick = () => {
          const done = v.currentTime - start;
          setPct(Math.min(99, Math.round((done / span) * 100)));
          if (v.ended || v.currentTime >= end) { resolve(); return; }
          window.setTimeout(tick, 200);
        };
        tick();
      });

      v.pause();
      cancelAnimationFrame(raf);
      recorder.stop();
      await once(recorder, 'stop');

      const blob = new Blob(chunks, { type: mimeType });
      if (!blob.size) throw new Error('Nothing was recorded. Try a shorter section.');
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const base = file.name.replace(/\.[^.]+$/, '');
      setPct(100);
      onReady(new File([blob], `${base}-web.${ext}`, { type: mimeType }));
    } catch (e) {
      cancelAnimationFrame(raf);
      setError((e as Error).message || 'Could not process this video here.');
    } finally {
      audioCtx?.close().catch(() => {});
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-maroon-700/30 bg-maroon-50/40 p-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-maroon-900">
        <Icon name="video" size={16} /> This video is too large. Trim or shrink it here.
      </h4>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        {file.name} is {fmtBytes(file.size)}; the most we can upload is {fmtBytes(maxBytes)}.
        Choose the section you want and a quality, and it will be re-encoded in your browser
        before uploading. Nothing is sent until you approve the result.
      </p>

      <video
        ref={videoRef}
        src={url}
        controls
        playsInline
        preload="metadata"
        className="mt-3 aspect-video w-full rounded-lg bg-black object-contain"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (!Number.isFinite(d)) return;
          setDuration(d);
          setStart(0);
          setEnd(d);
        }}
      />

      {duration > 0 ? (
        <div className="mt-3 grid gap-3">
          <label className="text-xs font-medium text-ink">
            Start: {fmtTime(start)}
            <input
              type="range"
              min={0}
              max={duration}
              step={0.5}
              value={start}
              disabled={busy}
              onChange={(e) => {
                const v = Math.min(Number(e.target.value), end - 1);
                setStart(Math.max(0, v));
                if (videoRef.current) videoRef.current.currentTime = Math.max(0, v);
              }}
              className="mt-1 w-full accent-maroon-700"
            />
          </label>
          <label className="text-xs font-medium text-ink">
            End: {fmtTime(end)}
            <input
              type="range"
              min={0}
              max={duration}
              step={0.5}
              value={end}
              disabled={busy}
              onChange={(e) => setEnd(Math.max(Number(e.target.value), start + 1))}
              className="mt-1 w-full accent-maroon-700"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {QUALITY.map((q) => (
              <button
                key={q.key}
                type="button"
                disabled={busy}
                onClick={() => setQuality(q.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  quality === q.key
                    ? 'border-maroon-700 bg-maroon-700 text-white'
                    : 'border-line bg-white text-ink-soft hover:bg-maroon-50'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-ink-soft">
            Keeping {fmtTime(span)} at {preset.key}. Estimated size{' '}
            <strong className={fits ? 'text-maroon-800' : 'text-rose-600'}>{fmtBytes(estimate)}</strong>
            {fits ? '' : ' — still too large, so trim further or pick a lower quality.'}
          </p>

          {busy ? (
            <div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-maroon-700 transition-[width]" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                Processing {pct}%. This runs at playback speed, so keep this tab open for
                about {fmtTime(span)}.
              </p>
            </div>
          ) : null}

          {error ? <p className="text-xs text-maroon-600">{error}</p> : null}
          {!supported ? (
            <p className="text-xs text-maroon-600">
              This browser cannot re-encode video. Try Chrome or Edge, or compress the file
              before uploading.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button onClick={prepare} size="md" icon="arrow-right" disabled={busy || !fits || !supported}>
              {busy ? 'Processing…' : 'Prepare and upload'}
            </Button>
            <Button onClick={onCancel} variant="ghost" size="md" disabled={busy}>Cancel</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
