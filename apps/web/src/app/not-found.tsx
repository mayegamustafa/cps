import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { NotFoundView } from '@/components/NotFoundView';

// Global fallback for unmatched routes (e.g. footer links to pages not built
// yet). Standalone branded page that guides the visitor back to the homepage.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-paper">
      <div className="border-b border-line px-6 py-5">
        <Link href="/" aria-label="Home"><Logo /></Link>
      </div>
      <div className="flex flex-1 items-center">
        <NotFoundView />
      </div>
    </main>
  );
}
