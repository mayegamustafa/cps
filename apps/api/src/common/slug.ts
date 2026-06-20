import { randomBytes } from 'node:crypto';

/** kebab-case a string for use in URLs. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

/** A URL slug from `text`, with a short random suffix to guarantee uniqueness. */
export function uniqueSlug(text: string): string {
  const base = slugify(text) || 'item';
  return `${base}-${randomBytes(3).toString('hex')}`;
}
