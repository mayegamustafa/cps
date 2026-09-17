'use client';

/**
 * Prints a standalone document without disturbing the page you are on.
 *
 * The sheet is written into a hidden same-origin iframe rather than the current
 * document, so the admin's own stylesheet, sidebar and topbar cannot reach the
 * paper, and nothing has to be hidden with print-only CSS. Browsers offer
 * "Save as PDF" from the same dialog, which is how a PDF is produced here
 * without shipping a PDF library.
 */
export function printDocument(title: string, bodyHtml: string): void {
  if (typeof document === 'undefined') return;

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }

  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Georgia, "Times New Roman", serif;
    color: #2b2b2b;
    font-size: 11pt;
    line-height: 1.5;
  }
  .sheet-head {
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 2px solid #6e1f23;
    padding-bottom: 10px;
    margin-bottom: 18px;
  }
  .sheet-head img { width: 46px; height: 46px; object-fit: contain; }
  .sheet-head h1 {
    margin: 0;
    font-size: 15pt;
    color: #6e1f23;
    letter-spacing: 0.01em;
  }
  .sheet-head .meta { margin: 2px 0 0; font-size: 9pt; color: #6b6b6b; font-family: Arial, sans-serif; }
  /* A record split across two sheets is hard to read and hard to file. */
  .record {
    border: 1px solid #ddd6d7;
    border-radius: 6px;
    padding: 12px 14px;
    margin: 0 0 12px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .record h2 { margin: 0 0 2px; font-size: 12pt; color: #2b2b2b; }
  .record .contact {
    margin: 0 0 8px;
    font-size: 9pt;
    color: #6b6b6b;
    font-family: Arial, sans-serif;
  }
  .record .subject {
    margin: 0 0 6px;
    font-weight: bold;
    font-size: 10.5pt;
    color: #6e1f23;
  }
  .record .message { margin: 0; white-space: pre-wrap; }
  .tag {
    display: inline-block;
    font-family: Arial, sans-serif;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border: 1px solid #6e1f23;
    color: #6e1f23;
    border-radius: 999px;
    padding: 1px 7px;
    margin-left: 6px;
    vertical-align: middle;
  }
  .tag.done { border-color: #2f7d52; color: #2f7d52; }
  .foot {
    margin-top: 16px;
    border-top: 1px solid #ddd6d7;
    padding-top: 8px;
    font-family: Arial, sans-serif;
    font-size: 8.5pt;
    color: #8a8a8a;
  }
</style></head><body>${bodyHtml}</body></html>`);
  doc.close();

  // Chrome needs the document, including its images, settled before print() or
  // the badge is missing from the first page.
  const go = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    // Removing it immediately cancels the dialog in Safari, so it lingers.
    window.setTimeout(() => frame.remove(), 60_000);
  };

  if (frame.contentWindow?.document.readyState === 'complete') {
    window.setTimeout(go, 60);
  } else {
    frame.onload = () => window.setTimeout(go, 60);
  }
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** The school heading that tops every printed sheet. */
export function sheetHead(title: string, subtitle?: string): string {
  const when = new Date().toLocaleString();
  return `<div class="sheet-head">
    <img src="/cps.png" alt="" />
    <div>
      <h1>City Parents School</h1>
      <p class="meta">${escapeHtml(title)}${subtitle ? ` &middot; ${escapeHtml(subtitle)}` : ''} &middot; printed ${escapeHtml(when)}</p>
    </div>
  </div>`;
}
