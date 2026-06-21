import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

// Called by the admin after saving settings so the public site (which caches
// the site config under the 'site-settings' tag) refreshes immediately instead
// of waiting for the revalidation window. Refreshing public cache is low-risk,
// so this is intentionally open. This explicit segment takes precedence over
// the /api/[...path] proxy.
export const dynamic = 'force-dynamic';

export async function POST() {
  revalidateTag('site-settings');
  return NextResponse.json({ revalidated: true });
}
