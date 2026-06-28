'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { Icon } from '@/components/Icon';
import { adminNav } from '@/lib/admin';
import { clearSession } from '@/lib/admin-auth';

/** Hamburger + slide-in drawer giving the admin nav on mobile/tablet
 *  (the fixed sidebar is desktop-only). */
export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open]);

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname?.startsWith(href));

  function signOut() {
    clearSession();
    router.replace('/admin/login');
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="rounded-full p-2.5 text-maroon-800 hover:bg-paper-dark lg:hidden"
      >
        <Icon name="menu" size={22} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-maroon-950/50 backdrop-blur-sm" />
          <nav aria-label="Admin" className="absolute left-0 top-0 flex h-full w-[82%] max-w-xs flex-col bg-maroon-950 text-paper/80 shadow-lift">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <Logo tone="light" />
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-2 text-paper/70 hover:bg-white/10 hover:text-white">
                <Icon name="close" size={22} />
              </button>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto p-3">
              {adminNav.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={[
                      'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                      active ? 'bg-gold-400 text-maroon-900' : 'text-paper/70 hover:bg-white/10 hover:text-white',
                    ].join(' ')}
                  >
                    <Icon name={item.icon} size={19} /> {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-white/10 p-3">
              <button
                type="button"
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-paper/70 hover:bg-white/10 hover:text-white"
              >
                <Icon name="logout" size={19} /> Sign out
              </button>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
