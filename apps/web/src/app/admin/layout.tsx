// The admin area is auth-gated and talks to the live API on every render
// (setup status, settings, etc.). It must NEVER be statically prerendered at
// build time: during the Railway build the API service isn't running yet, so
// prerendering admin pages fails (e.g. /admin/setup). Rendering per-request
// defers all that work to runtime, when env vars are set and the API is up.
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
