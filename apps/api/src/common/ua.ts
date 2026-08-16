/** Dependency-free user-agent and traffic-source classification. */

export function parseDevice(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function parseBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/OPR\/|Opera/i.test(ua)) return 'Opera';
  if (/SamsungBrowser/i.test(ua)) return 'Samsung Internet';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return 'Chrome';
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  return 'Other';
}

export function parseOs(ua: string): string {
  if (/Windows NT/i.test(ua)) return 'Windows';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Other';
}

/**
 * Canonical name for a network, from either a `utm_source` value or a hostname.
 * Returns null when nothing recognisable is present.
 */
function knownNetwork(text: string): string | null {
  const t = text.toLowerCase();
  if (/tiktok/.test(t)) return 'tiktok';
  if (/instagram|^ig$/.test(t)) return 'instagram';
  if (/facebook|(^|\.)fb\b|^fb$/.test(t)) return 'facebook';
  if (/whatsapp|^wa$|wa\.me/.test(t)) return 'whatsapp';
  if (/youtube|youtu\.be/.test(t)) return 'youtube';
  if (/linkedin|lnkd\.in/.test(t)) return 'linkedin';
  if (/telegram|t\.me/.test(t)) return 'telegram';
  if (/twitter|(^|\.)x\.com|^x$|(^|\.)t\.co$/.test(t)) return 'x';
  if (/snapchat/.test(t)) return 'snapchat';
  if (/pinterest/.test(t)) return 'pinterest';
  if (/reddit/.test(t)) return 'reddit';
  if (/google|bing|duckduckgo|yahoo|ecosia|baidu/.test(t)) return 'search';
  if (/newsletter|email|mailchimp|gmail|outlook/.test(t)) return 'email';
  return null;
}

/**
 * Where a visit came from.
 *
 * `utmSource` is checked first and is the only reliable signal for social:
 * TikTok, Instagram and Facebook open links in an in-app browser that usually
 * sends no referrer at all, so a link posted without a `?utm_source=` tag turns
 * up here as "direct" no matter which app it came from. Referrer parsing is the
 * fallback for everything else.
 */
export function classifySource(
  referrer: string | undefined,
  selfHost?: string,
  utmSource?: string,
): string {
  const tagged = (utmSource ?? '').trim();
  if (tagged) return knownNetwork(tagged) ?? tagged.toLowerCase().slice(0, 32);

  if (!referrer) return 'direct';
  let host = '';
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return 'direct';
  }
  if (!host || (selfHost && host === selfHost)) return 'direct';
  return knownNetwork(host) ?? 'referral';
}

/** Display name for a stored source key. */
export function sourceLabel(source: string): string {
  const map: Record<string, string> = {
    tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook',
    whatsapp: 'WhatsApp', youtube: 'YouTube', linkedin: 'LinkedIn',
    telegram: 'Telegram', x: 'X (Twitter)', snapchat: 'Snapchat',
    pinterest: 'Pinterest', reddit: 'Reddit', search: 'Search engines',
    email: 'Email', referral: 'Other websites', direct: 'Direct or untagged',
  };
  return map[source] ?? source.charAt(0).toUpperCase() + source.slice(1);
}
