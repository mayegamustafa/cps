/** Media helpers: derive a usable cover image, including from video URLs. */

/** Extracts a YouTube video id from common URL shapes. */
function youtubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([\w-]{11})/,
    /[?&]v=([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

/**
 * Returns an image URL for any media URL. For YouTube videos it returns the
 * auto-generated thumbnail; for everything else it returns the URL unchanged
 * (already an image). Lets covers be "auto got from the videos themselves".
 */
export function videoThumbnail(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  const yt = youtubeId(url);
  if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
  return url;
}

/**
 * Picks the cover for an album: an explicit cover (converted to a thumbnail if
 * it is a video), otherwise the first photo/video in the list.
 */
export function deriveCover(images: string[] | undefined, coverImage?: string): string | undefined {
  if (coverImage && coverImage.trim()) return videoThumbnail(coverImage);
  const first = images?.find((u) => u && u.trim());
  return videoThumbnail(first);
}
