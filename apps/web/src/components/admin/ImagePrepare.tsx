'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/ui/Button';

/**
 * Crop, straighten and shrink a picture before it is uploaded.
 *
 * Photos arrive from phones and designers in whatever shape they were made in,
 * and the fix has until now been to send them back out to another tool. This does
 * the work with the APIs the browser already has: the file is drawn into a canvas,
 * rotation and flipping are applied when that canvas is redrawn, and the crop is
 * kept as fractions of the picture so it survives both. Nothing is uploaded until
 * the result is approved, and the original file is never modified.
 *
 * It opens as a dialog rather than inline because a crop needs room to work in,
 * and the editor is used from admin forms whose columns can be narrow.
 */

type Crop = { x: number; y: number; w: number; h: number }; // fractions of the picture
type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move';

type AspectKey = 'free' | 'original' | 'square' | 'portrait' | 'photo' | 'wide';

const ASPECTS: { key: AspectKey; label: string; ratio?: number }[] = [
  { key: 'free', label: 'Free' },
  { key: 'original', label: 'Original' },
  { key: 'square', label: 'Square', ratio: 1 },
  { key: 'portrait', label: '4:5', ratio: 4 / 5 },
  { key: 'photo', label: '3:2', ratio: 3 / 2 },
  { key: 'wide', label: '16:9', ratio: 16 / 9 },
];

/** A sane ceiling for a web picture; anything larger only costs the visitor data. */
const MAX_OUTPUT_DIM = 2600;

const FULL: Crop = { x: 0, y: 0, w: 1, h: 1 };

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function clamp(v: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, v));
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Draw the source onto a canvas at its natural size, with EXIF rotation applied. */
async function loadBase(source: File | string): Promise<HTMLCanvasElement> {
  let width = 0;
  let height = 0;
  let drawable: CanvasImageSource;

  if (typeof source === 'string') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = source;
    await img.decode();
    drawable = img;
    width = img.naturalWidth;
    height = img.naturalHeight;
  } else if (typeof createImageBitmap === 'function') {
    // `from-image` keeps a phone photo the way up it was taken.
    const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
    drawable = bitmap;
    width = bitmap.width;
    height = bitmap.height;
  } else {
    const url = URL.createObjectURL(source);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      drawable = img;
      width = img.naturalWidth;
      height = img.naturalHeight;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  if (!width || !height) throw new Error('This file could not be read as a picture.');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot edit pictures here.');
  ctx.drawImage(drawable, 0, 0);

  // A picture from another site can be shown but not read back out of a canvas.
  // Finding that out now beats failing at the moment the crop is applied.
  try {
    ctx.getImageData(0, 0, 1, 1);
  } catch {
    throw new Error(
      'This picture is served from another site, so it cannot be edited here. Upload the file itself and it can be cropped.',
    );
  }
  return canvas;
}

/** The picture as it currently reads: rotated and flipped, ready to crop. */
function renderView(base: HTMLCanvasElement, rotation: number, flip: boolean): HTMLCanvasElement {
  const turned = rotation % 180 !== 0;
  const canvas = document.createElement('canvas');
  canvas.width = turned ? base.height : base.width;
  canvas.height = turned ? base.width : base.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return base;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(base, -base.width / 2, -base.height / 2);
  return canvas;
}

export function ImagePrepare({
  source,
  fileName,
  maxBytes,
  reason,
  onReady,
  onCancel,
}: {
  source: File | string;
  fileName?: string;
  maxBytes?: number;
  reason?: string;
  onReady: (file: File) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ handle: Handle; startX: number; startY: number; crop: Crop } | null>(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState(false);
  const [crop, setCrop] = useState<Crop>(FULL);
  const [aspect, setAspect] = useState<AspectKey>('free');
  const [view, setView] = useState({ w: 0, h: 0 });

  // Read the picture once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = await loadBase(source);
        if (cancelled) return;
        baseRef.current = base;
        setReady(true);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => { cancelled = true; };
  }, [source]);

  // Repaint whenever the picture is turned over.
  useEffect(() => {
    const base = baseRef.current;
    const canvas = canvasRef.current;
    if (!ready || !base || !canvas) return;
    const v = renderView(base, rotation, flip);
    canvas.width = v.width;
    canvas.height = v.height;
    canvas.getContext('2d')?.drawImage(v, 0, 0);
    setView({ w: v.width, h: v.height });
  }, [ready, rotation, flip]);

  const ratioFor = useCallback(
    (key: AspectKey): number | null => {
      if (key === 'free') return null;
      if (key === 'original') return view.w && view.h ? view.w / view.h : null;
      return ASPECTS.find((a) => a.key === key)?.ratio ?? null;
    },
    [view],
  );

  /** Force `c` to the wanted shape, holding the corner the drag is not moving. */
  const withAspect = useCallback(
    (c: Crop, key: AspectKey, handle: Handle): Crop => {
      const ratio = ratioFor(key);
      if (!ratio || !view.w || !view.h) return c;
      const next = { ...c };
      // Height in fractions that gives `ratio` once the picture's own shape is counted.
      const hFromW = (next.w * view.w) / (ratio * view.h);
      const wFromH = (next.h * view.h * ratio) / view.w;
      const vertical = handle === 'n' || handle === 's';
      if (vertical) next.w = wFromH;
      else next.h = hFromW;

      if (handle.includes('n')) next.y = c.y + c.h - next.h;
      if (handle.includes('w')) next.x = c.x + c.w - next.w;
      if (next.x < 0 || next.y < 0 || next.x + next.w > 1 || next.y + next.h > 1) {
        // Shrink to fit rather than slide, so the anchored corner stays put.
        const scale = Math.min(
          1,
          next.w > 0 ? (next.x < 0 ? (c.x + c.w) / next.w : (1 - next.x) / next.w) : 1,
          next.h > 0 ? (next.y < 0 ? (c.y + c.h) / next.h : (1 - next.y) / next.h) : 1,
        );
        next.w *= scale;
        next.h *= scale;
        if (handle.includes('n')) next.y = c.y + c.h - next.h;
        if (handle.includes('w')) next.x = c.x + c.w - next.w;
        next.x = clamp(next.x, 0, 1 - next.w);
        next.y = clamp(next.y, 0, 1 - next.h);
      }
      return next;
    },
    [ratioFor, view],
  );

  function chooseAspect(key: AspectKey) {
    setAspect(key);
    setCrop((c) => withAspect({ ...c }, key, 'se'));
  }

  function onPointerDown(e: React.PointerEvent, handle: Handle) {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { handle, startX: e.clientX, startY: e.clientY, crop };
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    const frame = frameRef.current;
    if (!drag || !frame) return;
    const box = frame.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const dx = (e.clientX - drag.startX) / box.width;
    const dy = (e.clientY - drag.startY) / box.height;
    const s = drag.crop;
    const min = 0.05;
    let next: Crop;

    if (drag.handle === 'move') {
      next = { ...s, x: clamp(s.x + dx, 0, 1 - s.w), y: clamp(s.y + dy, 0, 1 - s.h) };
      setCrop(next);
      return;
    }

    next = { ...s };
    if (drag.handle.includes('w')) {
      const x = clamp(s.x + dx, 0, s.x + s.w - min);
      next.w = s.x + s.w - x;
      next.x = x;
    }
    if (drag.handle.includes('e')) next.w = clamp(s.w + dx, min, 1 - s.x);
    if (drag.handle.includes('n')) {
      const y = clamp(s.y + dy, 0, s.y + s.h - min);
      next.h = s.y + s.h - y;
      next.y = y;
    }
    if (drag.handle.includes('s')) next.h = clamp(s.h + dy, min, 1 - s.y);
    setCrop(withAspect(next, aspect, drag.handle));
  }

  function endDrag() {
    dragRef.current = null;
  }

  function reset() {
    setRotation(0);
    setFlip(false);
    setAspect('free');
    setCrop(FULL);
  }

  const outW = Math.max(1, Math.round(crop.w * view.w));
  const outH = Math.max(1, Math.round(crop.h * view.h));
  const scaled = Math.max(outW, outH) > MAX_OUTPUT_DIM;
  const finalW = scaled ? Math.round(outW * (MAX_OUTPUT_DIM / Math.max(outW, outH))) : outW;
  const finalH = scaled ? Math.round(outH * (MAX_OUTPUT_DIM / Math.max(outW, outH))) : outH;

  async function apply() {
    const base = baseRef.current;
    if (!base) return;
    setBusy(true);
    setError('');
    try {
      const v = renderView(base, rotation, flip);
      const out = document.createElement('canvas');
      out.width = finalW;
      out.height = finalH;
      const ctx = out.getContext('2d');
      if (!ctx) throw new Error('This browser cannot edit pictures here.');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        v,
        Math.round(crop.x * v.width),
        Math.round(crop.y * v.height),
        outW,
        outH,
        0,
        0,
        finalW,
        finalH,
      );

      const sourceType = typeof source === 'string' ? '' : source.type;
      // PNG keeps transparency, which a logo needs; photographs go out as JPEG
      // because a PNG of a photograph is many times the size for no visible gain.
      const keepPng = sourceType === 'image/png' && !maxBytes;
      const type = keepPng ? 'image/png' : 'image/jpeg';

      let blob = await canvasToBlob(out, type, 0.92);
      if (!blob) throw new Error('The edited picture could not be created.');

      // Still too heavy for the upload limit: drop quality, then size, until it fits.
      if (maxBytes) {
        for (const quality of [0.85, 0.75, 0.65]) {
          if (blob.size <= maxBytes) break;
          blob = (await canvasToBlob(out, 'image/jpeg', quality)) ?? blob;
        }
        let shrink = out;
        while (blob.size > maxBytes && shrink.width > 600) {
          const next = document.createElement('canvas');
          next.width = Math.round(shrink.width * 0.75);
          next.height = Math.round(shrink.height * 0.75);
          const nctx = next.getContext('2d');
          if (!nctx) break;
          nctx.imageSmoothingQuality = 'high';
          nctx.drawImage(shrink, 0, 0, next.width, next.height);
          shrink = next;
          blob = (await canvasToBlob(next, 'image/jpeg', 0.8)) ?? blob;
        }
        if (blob.size > maxBytes) {
          throw new Error(`Even at the smallest size this comes to ${fmtBytes(blob.size)}. Crop it tighter and try again.`);
        }
      }

      const base_name = (fileName || (typeof source === 'string' ? 'image' : source.name)).replace(/\.[^.]+$/, '');
      const ext = blob.type === 'image/png' ? 'png' : 'jpg';
      onReady(new File([blob], `${base_name}-edited.${ext}`, { type: blob.type }));
    } catch (e) {
      setError((e as Error).message || 'Could not edit this picture.');
      setBusy(false);
    }
  }

  // Escape closes, and the page behind should not scroll while this is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [busy, onCancel]);

  const handles: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
  const handlePos: Record<string, string> = {
    nw: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize',
    n: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize',
    ne: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize',
    e: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
    se: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize',
    s: 'left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize',
    sw: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize',
    w: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Edit picture" className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div aria-hidden onClick={() => (busy ? null : onCancel())} className="absolute inset-0 bg-maroon-950/70 backdrop-blur-sm" />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h3 className="flex items-center gap-2 font-display text-lg text-maroon-900">
            <Icon name="image" size={18} /> Edit picture
          </h3>
          <button type="button" onClick={onCancel} disabled={busy} aria-label="Close" className="rounded-full p-2 text-ink-muted hover:bg-maroon-50 hover:text-maroon-700 disabled:opacity-50">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {reason ? <p className="mb-3 rounded-xl bg-maroon-50/70 p-3 text-xs leading-relaxed text-maroon-900">{reason}</p> : null}

          {error && !ready ? (
            <p className="text-sm leading-relaxed text-maroon-700">{error}</p>
          ) : !ready ? (
            <p className="py-10 text-center text-sm text-ink-muted">Opening the picture…</p>
          ) : (
            <>
              <div className="flex justify-center rounded-xl bg-paper-dark/40 p-3">
                <div ref={frameRef} className="relative inline-block touch-none select-none overflow-hidden rounded-lg">
                  <canvas ref={canvasRef} className="block max-h-[52vh] w-auto max-w-full rounded-lg" />

                  {/* Everything outside the crop is dimmed by one huge shadow. */}
                  <div
                    onPointerDown={(e) => onPointerDown(e, 'move')}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    className="absolute cursor-move shadow-[0_0_0_9999px_rgba(20,12,16,0.55)] ring-2 ring-white/90"
                    style={{
                      left: `${crop.x * 100}%`,
                      top: `${crop.y * 100}%`,
                      width: `${crop.w * 100}%`,
                      height: `${crop.h * 100}%`,
                    }}
                  >
                    {handles.map((h) => (
                      <span
                        key={h}
                        onPointerDown={(e) => onPointerDown(e, h)}
                        onPointerMove={onPointerMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        className={`absolute h-3.5 w-3.5 rounded-full border-2 border-maroon-700 bg-white shadow-sm ${handlePos[h]}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Shape</span>
                {ASPECTS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    disabled={busy}
                    onClick={() => chooseAspect(a.key)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      aspect === a.key ? 'border-maroon-700 bg-maroon-700 text-white' : 'border-line bg-white text-ink-soft hover:bg-maroon-50'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Turn</span>
                <button type="button" disabled={busy} onClick={() => setRotation((r) => (r + 270) % 360)} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-maroon-50">
                  <Icon name="refresh" size={14} className="-scale-x-100" /> Left
                </button>
                <button type="button" disabled={busy} onClick={() => setRotation((r) => (r + 90) % 360)} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-maroon-50">
                  <Icon name="refresh" size={14} /> Right
                </button>
                <button type="button" disabled={busy} onClick={() => setFlip((f) => !f)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${flip ? 'border-maroon-700 bg-maroon-700 text-white' : 'border-line bg-white text-ink-soft hover:bg-maroon-50'}`}>
                  Mirror
                </button>
                <button type="button" disabled={busy} onClick={reset} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-maroon-50">
                  Reset
                </button>
              </div>

              <p className="mt-3 text-xs text-ink-soft">
                Drag inside the picture to move the frame, or pull a handle to resize it. Saving gives{' '}
                <strong className="text-maroon-800">{finalW} × {finalH}</strong> pixels
                {scaled ? `, scaled down from ${outW} × ${outH} so it stays quick to load` : ''}.
              </p>
              {error ? <p className="mt-2 text-xs leading-relaxed text-maroon-700">{error}</p> : null}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3.5">
          <Button type="button" onClick={apply} size="md" icon="arrow-right" disabled={!ready || busy}>
            {busy ? 'Saving…' : 'Save and upload'}
          </Button>
          <Button type="button" onClick={onCancel} variant="ghost" size="md" disabled={busy}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
