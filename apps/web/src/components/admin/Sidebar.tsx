'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { Icon } from '@/components/Icon';
import { adminNav } from '@/lib/admin';
import { clearSession } from '@/lib/admin-auth';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function signOut() {
    clearSession();
    router.replace('/admin/login');
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-maroon-800/40 bg-maroon-950 text-paper/80 lg:flex">
      <div className="border-b border-white/10 px-6 py-5">
        <Logo tone="light" />
      </div>
      <nav className="flex-1 space-y-1 p-4" aria-label="Admin">
        {adminNav.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-gold-400 text-maroon-900'
                  : 'text-paper/70 hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              <Icon name={item.icon} size={19} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-paper/70 hover:bg-white/10 hover:text-white"
        >
          <Icon name="logout" size={19} /> Sign out
        </button>
      </div>
    </aside>
  );
}
