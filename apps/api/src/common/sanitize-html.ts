/**
 * Strips anything executable out of author-written HTML.
 *
 * Article bodies now arrive as HTML from the editor. Even though only signed-in
 * staff can write them, storing raw HTML and printing it into a public page is
 * exactly the shape of a stored cross-site scripting hole: one compromised
 * editor account, or one careless paste from a web page, and every visitor runs
 * it. Cleaning on the way in means the stored copy is already safe, so every
 * reader of that column benefits without having to remember to escape.
 *
 * This is an allowlist: anything not named here is removed.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr', 'div', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'sub', 'sup', 'mark', 'small',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption',
]);

/** Attributes kept per tag. Everything else, including every on* handler, goes. */
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'title', 'width', 'height']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
  '*': new Set(['align']),
};

/** Tags whose entire contents are dropped, not just the tag itself. */
const STRIP_WITH_CONTENT =
  /<(script|style|iframe|object|embed|form|input|button|textarea|select|noscript|template|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

const VOID_TAGS = new Set(['br', 'hr', 'img']);

/** Only schemes that cannot execute. `javascript:` and `data:` are the danger. */
function safeUrl(value: string, allowData = false): string | null {
  const url = value.trim();
  if (!url) return null;
  // Entities and control characters are how javascript: gets smuggled past a
  // naive prefix check, so anything not plainly printable is refused.
  if (/[^\x20-\x7e -￿]/.test(url)) return null;
  const decoded = url
    .replace(/&#(\d+);?/g, (_m, d) => String.fromCharCode(Number(d)))
    .replace(/\s/g, '')
    .toLowerCase();
  if (/^(javascript|vbscript|file):/.test(decoded)) return null;
  if (/^data:/.test(decoded)) {
    return allowData && /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(url) ? url : null;
  }
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(url)) return url;
  // A bare "example.com/x" is relative; allow it rather than guessing a scheme.
  return /^[\w.\-/]+$/.test(url) ? url : null;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function cleanAttributes(tag: string, raw: string): string {
  const allowed = ALLOWED_ATTRS[tag];
  const global = ALLOWED_ATTRS['*'];
  const out: string[] = [];

  const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(raw))) {
    const name = m[1].toLowerCase();
    const value = m[3] ?? m[4] ?? m[5] ?? '';
    if (name.startsWith('on')) continue;
    if (!allowed?.has(name) && !global.has(name)) continue;

    if (name === 'href') {
      const safe = safeUrl(value);
      if (!safe) continue;
      out.push(`href="${escapeAttr(safe)}"`);
      continue;
    }
    if (name === 'src') {
      const safe = safeUrl(value, true);
      if (!safe) continue;
      out.push(`src="${escapeAttr(safe)}"`);
      continue;
    }
    if (name === 'target') {
      out.push('target="_blank"');
      continue;
    }
    out.push(`${name}="${escapeAttr(value)}"`);
  }

  // A new tab without noopener hands window.opener to the destination page.
  if (tag === 'a' && out.some((a) => a.startsWith('target='))) {
    if (!out.some((a) => a.startsWith('rel='))) out.push('rel="noopener noreferrer"');
  }
  return out.length ? ' ' + out.join(' ') : '';
}

/** Returns the HTML with only allowlisted tags, attributes and URL schemes. */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return '';

  let html = String(input).replace(STRIP_WITH_CONTENT, '');
  // A dangerous tag left unclosed would survive the pass above.
  html = html.replace(/<(script|style|iframe|object|embed|noscript|svg|math)\b[^>]*>/gi, '');

  const openTags: string[] = [];
  let out = '';
  const tokenRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|<!--[\s\S]*?-->|<[^>]*>/g;
  let last = 0;
  let token: RegExpExecArray | null;

  while ((token = tokenRe.exec(html))) {
    out += html.slice(last, token.index);
    last = token.index + token[0].length;

    const name = token[1]?.toLowerCase();
    if (!name) continue; // a comment or a stray bracket: drop it

    const isClosing = token[0].startsWith('</');
    if (!ALLOWED_TAGS.has(name)) continue;

    if (isClosing) {
      const at = openTags.lastIndexOf(name);
      if (at === -1) continue; // never opened, so never close it
      openTags.splice(at, 1);
      out += `</${name}>`;
      continue;
    }

    if (VOID_TAGS.has(name)) {
      out += `<${name}${cleanAttributes(name, token[2] ?? '')} />`;
      continue;
    }
    openTags.push(name);
    out += `<${name}${cleanAttributes(name, token[2] ?? '')}>`;
  }
  out += html.slice(last);

  // Close whatever the author left hanging, so one stray tag cannot swallow the
  // rest of the page it is printed into.
  for (const tag of openTags.reverse()) out += `</${tag}>`;
  return out;
}
