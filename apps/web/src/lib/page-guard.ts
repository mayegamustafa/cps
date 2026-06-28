import { notFound } from 'next/navigation';
import { getSiteConfig } from './site-config';
import type { SiteConfig } from './site';

/** 404s a page when the admin has disabled it under Website Control. */
export async function assertPageEnabled(key: keyof SiteConfig['pages']) {
  const cfg = await getSiteConfig();
  if (cfg.pages?.[key] === false) notFound();
}
