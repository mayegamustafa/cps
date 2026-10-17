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

/**
 * Cleans up a pasted link before anything tries to recognise it.
 *
 * The editor used to pre-fill the box with "https://", so pasting a full link on
 * top of it produced "https://https://x.com/...". That still looks like a URL to
 * a naive prefix check, so it sailed past and then matched no provider, and the
 * post silently rendered as a plain link instead of an embed.
 */
export function normalizeUrl(input: string): string {
  let url = (input ?? '').trim();
  // Strip any number of repeated schemes, however they were doubled up.
  for (let i = 0; i < 4; i++) {
    const doubled = url.match(/^https?:\/\/(https?:\/\/.*)$/i);
    if (!doubled) break;
    url = doubled[1];
  }
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url;
}

/**
 * Pulls a usable link out of whatever somebody actually pasted.
 *
 * People do not paste clean URLs. They paste the share text around a link, the
 * embed code the platform offered them, a mobile link, a link with tracking
 * parameters on the end, or a link with a full stop stuck to it because it came
 * at the end of a sentence. All of those mean "embed this post", and the editor
 * should work that out rather than refuse and leave the writer guessing.
 */
export function extractEmbedUrl(input: string): string {
  const text = (input ?? '').trim();
  if (!text) return '';

  // Embed code copied from the platform: take the link out of it.
  const fromIframe = text.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  const fromCite = text.match(/<blockquote[^>]+cite=["']([^"']+)["']/i);
  const fromAnchor = text.match(/<a[^>]+href=["']([^"']+)["']/i);
  const candidate = fromIframe?.[1] ?? fromCite?.[1] ?? fromAnchor?.[1] ?? text;

  // The first thing in it that looks like a link, so surrounding share text,
  // quotation marks and stray words do not matter.
  const found = candidate.match(/(https?:\/\/[^\s<>"']+|(?:www\.)?[a-z0-9-]+\.[a-z]{2,}\/[^\s<>"']*)/i);
  let url = normalizeUrl(found ? found[0] : candidate);

  // A link at the end of a sentence arrives with the punctuation attached.
  url = url.replace(/[.,;:!?)\]]+$/, '');
  return stripTracking(url);
}

/**
 * Removes the parameters a share button adds.
 *
 * X appends ?t=&s=20, Instagram adds igshid, Facebook adds fbclid. They carry no
 * meaning for an embed and some platforms refuse to resolve a post when they are
 * present, so a link that works in a browser silently fails to embed.
 */
function stripTracking(url: string): string {
  try {
    const u = new URL(url);
    const junk = ['t', 's', 'si', 'igshid', 'fbclid', 'feature', 'ref', 'ref_src', 'ref_url'];
    for (const key of [...u.searchParams.keys()]) {
      if (junk.includes(key) || key.toLowerCase().startsWith('utm_')) u.searchParams.delete(key);
    }
    return u.toString().replace(/\?$/, '');
  } catch {
    return url;
  }
}

/** True when a link is one this page knows how to turn into a real embed. */
export function isEmbeddable(url: string): boolean {
  return resolveSocialEmbed(url).kind !== 'link';
}

/** The hostname, or an empty string when the link cannot be parsed at all. */
function hostOfUrl(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function resolveSocialEmbed(input: string): SocialEmbed {
  const url = stripTracking(normalizeUrl(input));
  if (!/^https?:\/\//i.test(url)) return { kind: 'link', provider: 'Link', url };

  // Matched on the parsed hostname rather than by searching the whole string,
  // so a link that merely mentions x.com somewhere in its path is not mistaken
  // for an X post.
  const host = hostOfUrl(url);
  const isHost = (...names: string[]) =>
    names.some((n) => host === n || host.endsWith(`.${n}`));

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

  if (isHost('tiktok.com', 'vt.tiktok.com', 'vm.tiktok.com')) {
    const id = url.match(/\/video\/(\d+)/)?.[1];
    return { kind: 'script', provider: 'tiktok', url, id };
  }

  if (isHost('twitter.com', 'x.com')) {
    return { kind: 'script', provider: 'twitter', url };
  }

  if (isHost('instagram.com', 'instagr.am')) {
    return { kind: 'script', provider: 'instagram', url };
  }

  if (isHost('facebook.com', 'fb.watch')) {
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

  return { kind: 'link', provider: host || 'Link', url };
}

