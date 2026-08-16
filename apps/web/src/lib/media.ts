/**
 * Media delivery helpers.
 *
 * Almost every photo and the hero video are served straight from Cloudinary as
 * untouched originals (`/upload/v123/city-parents/abc.jpg`), which means a phone
 * on mobile data downloads the full camera-resolution file. Cloudinary resizes
 * and re-encodes at the edge when you insert a transformation segment right
 * after `/upload/`, so these helpers rewrite the URLs we already have instead of
 * requiring new uploads or a Next.js image loader.
 *
 * Non-Cloudinary URLs (Unsplash, local /public files, blobs) are returned
 * untouched so nothing breaks when the media source changes.
 */

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|video)\/upload)\/(.*)$/;

/** Widths we generate srcsets at — covers 360px phones through 2x desktop. */
export const IMAGE_WIDTHS = [420, 640, 828, 1200, 1600, 2048] as const;

/** A path segment like `so_0` or `f_auto,q_auto` — never a `v123…` version. */
function isTransformSegment(segment: string): boolean {
  return /^[a-z]{1,3}_/.test(segment) && !/^v\d+$/.test(segment);
}

/**
 * Insert `ops` into a Cloudinary URL, chaining after any transformation already
 * present rather than discarding it. Chaining matters for video posters, which
 * carry a `so_0` frame selector that must survive the resize — dropping it (or
 * refusing to add a width because of it) is what made every srcset entry
 * resolve to the same file.
 */
function transform(url: string, ops: string): string {
  const match = url?.match(CLOUDINARY_UPLOAD);
  if (!match) return url;
  const [, base, rest] = match;
  const segments = rest.split('/');
  const existing: string[] = [];
  while (segments.length > 1 && isTransformSegment(segments[0])) {
    existing.push(segments.shift() as string);
  }
  return [base, ...existing, ops, segments.join('/')].join('/');
}

/** A single optimised image URL at `width` px (AVIF/WebP negotiated per browser). */
export function img(url: string, width?: number): string {
  if (!url) return url;
  const ops = ['f_auto', 'q_auto', 'c_limit', width ? `w_${width}` : 'w_1600'].join(',');
  return transform(url, ops);
}

/** `srcset` string so the browser picks the smallest file that fits the slot. */
export function imgSrcSet(url: string, widths: readonly number[] = IMAGE_WIDTHS): string {
  if (!url || !CLOUDINARY_UPLOAD.test(url)) return '';
  return widths.map((w) => `${img(url, w)} ${w}w`).join(', ');
}

/**
 * Hero video, re-encoded and capped at `width`. `vc_auto` lets Cloudinary pick
 * h264/vp9/av1 per browser; the originals are typically 10-20x larger.
 */
export function video(url: string, width = 1280): string {
  if (!url) return url;
  return transform(url, `f_auto,q_auto,vc_auto,w_${width}`);
}

/**
 * A still frame from a Cloudinary video, used as the poster / low-data fallback.
 * Only the frame selector is applied here — sizing is left to `img`/`imgSrcSet`
 * so the still still gets a real responsive srcset.
 */
export function videoPoster(url: string): string {
  if (!url) return '';
  const posterUrl = transform(url, 'so_0');
  return posterUrl === url ? '' : posterUrl.replace(/\.(mp4|webm|mov|m4v)$/i, '.jpg');
}

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv|avi|mkv|wmv|flv|3gp|mpe?g|ts)(\?|#|$)/i;

/** True when a stored media URL points at a video rather than a still. */
export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  return VIDEO_EXT.test(url) || /res\.cloudinary\.com\/[^/]+\/video\/upload\//.test(url);
}

/**
 * A still image for any media URL: the URL itself for photos, and a frame
 * grabbed from the start for videos. Album covers and grid tiles are `<img>`
 * elements, so without this a video in an album renders as a broken picture.
 */
export function mediaPoster(url: string, width?: number): string {
  if (!url) return url;
  if (!isVideoUrl(url)) return img(url, width);
  const poster = videoPoster(url);
  return poster ? img(poster, width) : '';
}

/** Everything an `<img>` needs for responsive delivery, spread straight onto the tag. */
export function imgProps(url: string, sizes: string, width = 1600) {
  const srcSet = imgSrcSet(url);
  return {
    src: img(url, width),
    ...(srcSet ? { srcSet, sizes } : {}),
  };
}
