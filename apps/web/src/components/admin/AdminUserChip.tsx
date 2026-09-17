'use client';

import Link from 'next/link';
import { useMe, initialsOf, roleLabel } from '@/lib/session';

/** The signed-in staff member in the topbar: picture, name and role. */
export function AdminUserChip() {
  const { me } = useMe();

  return (
    <Link
      href="/admin/profile"
      title="Your profile"
      className="flex items-center gap-2.5 rounded-full border border-line bg-paper py-1 pl-1 pr-3 transition-colors hover:border-maroon-300"
    >
      {me?.avatarUrl ? (
        // A plain img keeps this working with any storage host without having to
        // list each one in the Next image config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={me.avatarUrl}
          alt=""
          className="h-8 w-8 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-maroon-700 text-sm font-semibold text-white">
          {initialsOf(me) || '...'}
        </span>
      )}
      <span className="hidden text-sm font-medium text-ink sm:block">
        {me ? `${me.firstName} ${me.lastName}` : 'Signed in'}
        <span className="block text-[11px] font-normal text-ink-muted">
          {me ? roleLabel(me.roles) : ''}
        </span>
      </span>
    </Link>
  );
}
