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

/** Maps a referrer URL to a coarse traffic source. */
export function classifySource(referrer: string | undefined, selfHost?: string): string {
  if (!referrer) return 'direct';
  let host = '';
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return 'direct';
  }
  if (!host || (selfHost && host === selfHost)) return 'direct';
  if (/(^|\.)(google|bing|duckduckgo|yahoo|ecosia|baidu)\./.test(host)) return 'search';
  if (/(^|\.)(facebook|fb)\./.test(host) || host === 'l.facebook.com') return 'facebook';
  if (/(^|\.)instagram\./.test(host)) return 'instagram';
  if (/(^|\.)tiktok\./.test(host)) return 'tiktok';
  if (/(^|\.)(youtube\.|youtu\.be)/.test(host)) return 'youtube';
  return 'referral';
}
