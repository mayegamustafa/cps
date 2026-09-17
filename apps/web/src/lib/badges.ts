'use client';

import { useEffect, useState } from 'react';
import type { BadgeKey } from '@/lib/admin';

export type Badges = Record<BadgeKey, number>;

/**
 * Counts of things waiting, shared by the sidebar and the mobile drawer.
 *
 * One shared copy on a timer, rather than a fetch per component: the drawer and
 * the sidebar are both mounted on every admin page, and two independent pollers
 * would double the requests and disagree with each other for a few seconds after
 * anything was dealt with.
 */
let cache: Badges | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<(b: Badges | null) => void>();

const REFRESH_MS = 60_000;

async function fetchBadges() {
  try {
    const res = await fetch('/api/badges');
    if (!res.ok) return;
    const next = (await res.json()) as Badges;
    cache = next;
    for (const listener of listeners) listener(next);
  } catch {
    // A blip should leave the last known counts on screen, not blank them.
  }
}

/** Call after handling something, so the badge drops without waiting for the timer. */
export function refreshBadges() {
  void fetchBadges();
}

export function useBadges(): Badges | null {
  const [badges, setBadges] = useState<Badges | null>(cache);

  useEffect(() => {
    listeners.add(setBadges);
    if (cache === null) void fetchBadges();
    if (!timer) timer = setInterval(fetchBadges, REFRESH_MS);

    return () => {
      listeners.delete(setBadges);
      if (listeners.size === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, []);

  return badges;
}
