import { siteDefaults, type SiteConfig } from './site';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Deep-merge saved settings over the defaults (arrays are replaced wholesale). */
function merge<T>(base: T, override: DeepPartial<T> | undefined): T {
  if (!override) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = (base as Record<string, unknown>)[key];
    out[key] =
      isObject(value) && isObject(baseValue)
        ? merge(baseValue, value as DeepPartial<typeof baseValue>)
        : value;
  }
  return out as T;
}

/**
 * Returns the live site configuration: admin-saved settings merged over the
 * defaults. Falls back to defaults when the API is unreachable, so the site
 * always renders.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const res = await fetch(`${API}/api/settings`, {
      next: { revalidate: 60, tags: ['site-settings'] },
    });
    if (!res.ok) return siteDefaults;
    const saved = (await res.json()) as DeepPartial<SiteConfig>;
    return merge(siteDefaults, saved);
  } catch {
    return siteDefaults;
  }
}
