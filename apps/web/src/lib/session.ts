'use client';

import { useEffect, useState } from 'react';

export type Me = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  roles: string[];
  mailboxAccess?: { mailboxId: string; canSend: boolean; canManage: boolean }[];
};

/**
 * The signed-in staff member, fetched once and shared.
 *
 * The sidebar, the topbar and the mailbox all need to know who this is; without
 * a shared copy each one would call /api/users/me on every mount and the topbar
 * would keep showing the old picture after the profile page saved a new one.
 */
let cache: Me | null = null;
let inFlight: Promise<Me | null> | null = null;
const listeners = new Set<(m: Me | null) => void>();

function publish(next: Me | null) {
  cache = next;
  for (const listener of listeners) listener(next);
}

export async function loadMe(force = false): Promise<Me | null> {
  if (cache && !force) return cache;
  if (inFlight && !force) return inFlight;
  inFlight = (async () => {
    try {
      const res = await fetch('/api/users/me');
      if (!res.ok) return null;
      const me = (await res.json()) as Me;
      publish(me);
      return me;
    } catch {
      return null;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Updates the shared copy after the profile form saves. */
export function updateMe(me: Me) {
  publish(me);
}

export function useMe(): { me: Me | null; loading: boolean } {
  const [me, setLocal] = useState<Me | null>(cache);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    listeners.add(setLocal);
    let cancelled = false;
    void loadMe().then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
      listeners.delete(setLocal);
    };
  }, []);

  return { me, loading };
}

export function initialsOf(me: { firstName?: string; lastName?: string; email?: string } | null): string {
  if (!me) return '';
  const first = me.firstName?.[0] ?? '';
  const last = me.lastName?.[0] ?? '';
  const pair = (first + last).trim();
  return (pair || me.email?.slice(0, 2) || '').toUpperCase();
}

/** A friendly label for the roles a person holds. */
export function roleLabel(roles: string[]): string {
  if (roles.includes('SUPER_ADMIN')) return 'Super Admin';
  if (roles.length === 0) return 'Staff';
  return roles[0]
    .toLowerCase()
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}
