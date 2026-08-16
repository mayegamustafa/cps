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
  | { kind: 'embed'; src: string; provider: string; autoplays: boolean; watchUrl: string }
  /** TikTok refuses to be framed directly and needs its own script. */
  | { kind: 'tiktok'; videoId: string; watchUrl: string }
  /** A vt./vm.tiktok.com share link; the id is behind a redirect. */
  | { kind: 'tiktok-short'; shortUrl: string }
  /** Known not to be embeddable: offer the link rather than an empty box. */
  | { kind: 'link'; provider: string; watchUrl: string }
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
      watchUrl: url,
      src: `https://www.youtube.com/embed/${yt}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`,
    };
  }

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return {
      kind: 'embed',
      provider: 'Vimeo',
      autoplays: true,
      watchUrl: url,
      src: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&muted=1&playsinline=1`,
    };
  }

  // TikTok video ids are the long number at the end of a share link.
  const tiktok = url.match(/tiktok\.com\/.*?\/video\/(\d+)/);
  if (tiktok) return { kind: 'tiktok', videoId: tiktok[1], watchUrl: url };

  // The Share button hands out vt./vm.tiktok.com links, which carry no id at
  // all: it sits behind a redirect and has to be looked up on the server.
  if (/^https?:\/\/(vt|vm)\.tiktok\.com\//i.test(url) || /tiktok\.com\/t\//i.test(url)) {
    return { kind: 'tiktok-short', shortUrl: url };
  }

  if (/facebook\.com|fb\.watch/.test(url)) {
    return {
      kind: 'embed',
      provider: 'Facebook',
      autoplays: false,
      watchUrl: url,
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=false`,
    };
  }

  if (/instagram\.com\/(reel|p|tv)\//.test(url)) {
    const clean = url.split('?')[0].replace(/\/$/, '');
    return {
      kind: 'embed',
      provider: 'Instagram',
      autoplays: false,
      watchUrl: url,
      src: `${clean}/embed`,
    };
  }

  // Something else entirely. Framing an arbitrary page usually ends in the
  // browser refusing it and the visitor seeing nothing, so offer the link.
  return { kind: 'link', provider: 'the original site', watchUrl: url };
}

/**
 * Turns a vt./vm.tiktok.com share link into a video id by following its
 * redirect. Runs on the server and is cached for a day, because a share link
 * always points at the same video.
 */
export async function resolveTikTokShortLink(shortUrl: string): Promise<string | null> {
  try {
    const res = await fetch(shortUrl, {
      redirect: 'follow',
      headers: {
        // TikTok answers short links differently without a browser agent.
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 86400 },
    });
    const match = (res.url ?? '').match(/\/video\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
