/**
 * Works out how to show a social post pasted into an article.
 *
 * Each platform publishes exactly one embed route and refuses the others, so
 * this cannot be one generic iframe:
 *
 * - YouTube and Vimeo frame cleanly and take an ordinary iframe.
 * - Facebook has a plugin endpoint that frames, given the post URL.
 * - X, Instagram and TikTok all refuse to be framed directly and publish a
 *   blockquote plus their own script instead. Each blockquote is a working link
 *   before the script runs, and stays one if it never does.
 *
 * Anything unrecognised becomes a plain link rather than an empty box.
 */

export type SocialEmbed =
  | { kind: 'iframe'; provider: string; src: string; title: string; aspect: string }
  | { kind: 'script'; provider: 'twitter' | 'instagram' | 'tiktok'; url: string; id?: string }
  | { kind: 'link'; provider: string; url: string };

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

export function resolveSocialEmbed(input: string): SocialEmbed {
  const url = (input ?? '').trim();
  if (!/^https?:\/\//i.test(url)) return { kind: 'link', provider: 'Link', url };

  const yt = youtubeId(url);
  if (yt) {
    return {
      kind: 'iframe',
      provider: 'YouTube',
      // nocookie keeps a reader who never plays it out of YouTube's ad profile.
      src: `https://www.youtube-nocookie.com/embed/${yt}`,
      title: 'YouTube video',
      aspect: '16 / 9',
    };
  }

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return {
      kind: 'iframe',
      provider: 'Vimeo',
      src: `https://player.vimeo.com/video/${vimeo[1]}`,
      title: 'Vimeo video',
      aspect: '16 / 9',
    };
  }

  if (/(^|\.)tiktok\.com\//i.test(url)) {
    const id = url.match(/\/video\/(\d+)/)?.[1];
    return { kind: 'script', provider: 'tiktok', url, id };
  }

  if (/(^|\.)(twitter\.com|x\.com)\//i.test(url)) {
    return { kind: 'script', provider: 'twitter', url };
  }

  if (/(^|\.)instagram\.com\//i.test(url)) {
    return { kind: 'script', provider: 'instagram', url };
  }

  if (/(^|\.)(facebook\.com|fb\.watch)\//i.test(url)) {
    const isVideo = /\/videos?\//i.test(url) || /fb\.watch/i.test(url);
    const endpoint = isVideo ? 'video.php' : 'post.php';
    return {
      kind: 'iframe',
      provider: 'Facebook',
      src: `https://www.facebook.com/plugins/${endpoint}?href=${encodeURIComponent(url)}&show_text=true&width=560`,
      title: 'Facebook post',
      aspect: isVideo ? '16 / 9' : '4 / 5',
    };
  }

  return { kind: 'link', provider: hostOf(url), url };
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Link';
  }
}
