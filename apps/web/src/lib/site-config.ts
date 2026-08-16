import { siteDefaults, type SiteConfig } from './site';
import { serverApi } from './api-base';

const API = serverApi();

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
/**
 * The last configuration successfully read from the API.
 *
 * Every deployment restarts the API, and during that window the fetch below
 * fails and the public site fell back to `siteDefaults` — showing visitors the
 * built-in demo copy instead of the school's own. Holding the last good answer
 * in memory means a restart shows slightly stale real content rather than
 * someone else's placeholder text. A freshly started web container has nothing
 * cached yet, so the defaults remain the last resort.
 */
let lastGoodConfig: SiteConfig | null = null;

export async function getSiteConfig(): Promise<SiteConfig> {
  // During the production build the API is not reachable; use defaults and let
  // runtime ISR fetch live data. Avoids slow/hanging builds.
  if (process.env.NEXT_PHASE === 'phase-production-build') return siteDefaults;
  try {
    const res = await fetch(`${API}/api/settings`, {
      // Short safety-net window; the admin save also triggers on-demand
      // revalidation of this tag, so edits appear within seconds.
      next: { revalidate: 15, tags: ['site-settings'] },
      // Fail fast so builds/SSR never hang when the API is unreachable.
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return lastGoodConfig ?? siteDefaults;
    const saved = (await res.json()) as DeepPartial<SiteConfig>;
    lastGoodConfig = merge(siteDefaults, saved);
    return lastGoodConfig;
  } catch {
    return lastGoodConfig ?? siteDefaults;
  }
}
