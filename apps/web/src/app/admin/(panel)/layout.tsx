import type { Metadata } from 'next';
import Link from 'next/link';
import { Sidebar } from '@/components/admin/Sidebar';
import { Icon } from '@/components/Icon';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-paper-dark/40">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/90 px-6 backdrop-blur">
          <div className="relative hidden sm:block">
            <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              placeholder="Search…"
              className="w-72 rounded-full border border-line bg-paper py-2 pl-10 pr-4 text-sm focus:border-maroon-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button aria-label="Notifications" className="relative rounded-full p-2 text-ink-soft hover:bg-paper-dark">
              <Icon name="bell" size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-maroon-600" />
            </button>
            <Link href="/" className="hidden text-sm font-medium text-ink-soft hover:text-maroon-700 sm:block">
              View site
            </Link>
            <div className="flex items-center gap-2.5 rounded-full border border-line bg-paper py-1 pl-1 pr-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-maroon-700 text-sm font-semibold text-white">SA</span>
              <span className="hidden text-sm font-medium text-ink sm:block">Super Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
