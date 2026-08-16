import { isVideoUrl } from '@/lib/media';

/**
 * Works out how to play whatever video link an admin pastes.
 *
 * A pasted link is not always a video file. Each platform has its own player and
 * its own rules about starting on its own, and those rules are theirs, not ours:
 *
 * - A direct file (our own uploads included) plays in a `<video>` and can
 *   autoplay, as long as it starts muted.
 * - YouTube and Vimeo honour an autoplay parameter, again only when muted.
 * - TikTok, Facebook and Instagram publish embeds that ignore autoplay entirely.
 *   Their players open paused with a play button, and no amount of markup on our
 *   side changes that.
 *
 * `autoplays` reports the truth for each case so the page can say so rather than
 * appear broken.
 */

export type VideoSource =
  | { kind: 'file'; src: string; autoplays: true }
  | { kind: 'embed'; src: string; provider: string; autoplays: boolean }
  | { kind: 'none' };

function youtubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([\w-]{11})/,
    /[?&]v=([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/live\/([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export function resolveVideoSource(input: string): VideoSource {
  const url = (input ?? '').trim();
  if (!url) return { kind: 'none' };

  // Our own uploads and any plain .mp4/.webm link.
  if (isVideoUrl(url)) return { kind: 'file', src: url, autoplays: true };

  const yt = youtubeId(url);
  if (yt) {
    return {
      kind: 'embed',
      provider: 'YouTube',
      autoplays: true,
      src: `https://www.youtube.com/embed/${yt}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`,
    };
  }

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return {
      kind: 'embed',
      provider: 'Vimeo',
      autoplays: true,
      src: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&muted=1&playsinline=1`,
    };
  }

  // TikTok video ids are the long number at the end of a share link.
  const tiktok = url.match(/tiktok\.com\/.*?\/video\/(\d+)/);
  if (tiktok) {
    return {
      kind: 'embed',
      provider: 'TikTok',
      autoplays: false,
      src: `https://www.tiktok.com/embed/v2/${tiktok[1]}`,
    };
  }

  if (/facebook\.com|fb\.watch/.test(url)) {
    return {
      kind: 'embed',
      provider: 'Facebook',
      autoplays: false,
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=false`,
    };
  }

  if (/instagram\.com\/(reel|p|tv)\//.test(url)) {
    const clean = url.split('?')[0].replace(/\/$/, '');
    return {
      kind: 'embed',
      provider: 'Instagram',
      autoplays: false,
      src: `${clean}/embed`,
    };
  }

  // Something else entirely: hand it to an iframe and hope it is embeddable.
  return { kind: 'embed', provider: 'the link', autoplays: false, src: url };
}
