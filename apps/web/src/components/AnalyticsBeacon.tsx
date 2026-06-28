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

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer: ref, visitorId: vid, sessionId: sid, isNew }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
