'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const VID = 'cps_vid';
const SID = 'cps_sid';

function rid(): string {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
}

/**
 * First-party, cookie-less page-view tracking. Generates an anonymous visitor id
 * (localStorage) and session id (sessionStorage) and reports each page view to
 * our own API — no third-party trackers, GDPR-conscious.
 */
export function AnalyticsBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Don't track the admin area.
    if (pathname?.startsWith('/admin')) return;

    let vid = localStorage.getItem(VID);
    const isNew = !vid;
    if (!vid) { vid = rid(); localStorage.setItem(VID, vid); }

    let sid = sessionStorage.getItem(SID);
    const firstInSession = !sid;
    if (!sid) { sid = rid(); sessionStorage.setItem(SID, sid); }

    const ref =
      firstInSession && document.referrer && !document.referrer.startsWith(location.origin)
        ? document.referrer
        : undefined;

    /**
     * `utm_source` from the landing URL, remembered for the whole session.
     *
     * This is the only dependable way to tell TikTok from Instagram: both open
     * links in an in-app browser that sends no referrer, so an untagged link
     * records as "direct" whichever app it came from. Tagging the links the
     * school posts is what makes the breakdown real.
     */
    const SRC = 'cps_src';
    const tagged = new URLSearchParams(window.location.search).get('utm_source') ?? '';
    if (tagged) sessionStorage.setItem(SRC, tagged.slice(0, 32));
    const utmSource = sessionStorage.getItem(SRC) ?? undefined;

    // The visitor's time zone is how the dashboard works out their country: the
    // site sits behind no CDN, so no cf-ipcountry style header ever reaches the
    // API. It costs nothing, needs no GeoIP service, and never involves an IP.
    let tz: string | undefined;
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* unsupported */ }

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer: ref, visitorId: vid, sessionId: sid, isNew, tz, utmSource }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
