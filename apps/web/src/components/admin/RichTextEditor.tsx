'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '@/components/Icon';
import { uploadFile } from '@/components/admin/FileUpload';

/**
 * A formatting editor for article bodies, with no editor dependency.
 *
 * It drives a contentEditable through document.execCommand. That API is marked
 * deprecated, but every browser still implements it and it is the only way to
 * get selection-aware formatting without pulling in a large editor package,
 * which this project has deliberately avoided elsewhere.
 *
 * The value is HTML. What the writer sees here is what the article page renders,
 * and the server strips anything unsafe on save.
 */

type Tool =
  | { kind: 'button'; label: string; icon?: IconName; text?: string; command: string; arg?: string }
  | { kind: 'divider' };

const TOOLS: Tool[] = [
  { kind: 'button', label: 'Bold', text: 'B', command: 'bold' },
  { kind: 'button', label: 'Italic', text: 'I', command: 'italic' },
  { kind: 'button', label: 'Underline', text: 'U', command: 'underline' },
  { kind: 'button', label: 'Strikethrough', text: 'S', command: 'strikeThrough' },
  { kind: 'divider' },
  { kind: 'button', label: 'Superscript', text: 'x²', command: 'superscript' },
  { kind: 'button', label: 'Subscript', text: 'x₂', command: 'subscript' },
  { kind: 'divider' },
  { kind: 'button', label: 'Heading', text: 'H2', command: 'formatBlock', arg: 'h2' },
  { kind: 'button', label: 'Subheading', text: 'H3', command: 'formatBlock', arg: 'h3' },
  { kind: 'button', label: 'Small heading', text: 'H4', command: 'formatBlock', arg: 'h4' },
  { kind: 'button', label: 'Normal text', text: 'P', command: 'formatBlock', arg: 'p' },
  { kind: 'divider' },
  { kind: 'button', label: 'Bulleted list', text: '•—', command: 'insertUnorderedList' },
  { kind: 'button', label: 'Numbered list', text: '1—', command: 'insertOrderedList' },
  { kind: 'button', label: 'Indent', text: '→', command: 'indent' },
  { kind: 'button', label: 'Outdent', text: '←', command: 'outdent' },
  { kind: 'button', label: 'Quote', icon: 'quote', command: 'formatBlock', arg: 'blockquote' },
  { kind: 'button', label: 'Code block', text: '</>', command: 'formatBlock', arg: 'pre' },
  { kind: 'divider' },
  { kind: 'button', label: 'Align left', text: 'L', command: 'justifyLeft' },
  { kind: 'button', label: 'Centre', text: 'C', command: 'justifyCenter' },
  { kind: 'button', label: 'Align right', text: 'R', command: 'justifyRight' },
  { kind: 'button', label: 'Justify', text: 'J', command: 'justifyFull' },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState('');

  /**
   * Writing innerHTML on every render would drop the caret to the start on each
   * keystroke, so the DOM owns the content while the writer is typing and is only
   * overwritten when the value genuinely changed elsewhere, such as loading a
   * different article.
   */
  useEffect(() => {
    const el = ref.current;
    if (!el || source) return;
    const incoming = toHtml(value);
    if (el.innerHTML !== incoming) el.innerHTML = incoming;
  }, [value, source]);

  const emit = useCallback(() => {
    const el = ref.current;
    if (el) onChange(el.innerHTML);
  }, [onChange]);

  function run(command: string, arg?: string) {
    ref.current?.focus();
    try {
      document.execCommand(command, false, arg);
    } catch {
      /* an unsupported command should never break the page */
    }
    emit();
  }

  function addLink() {
    const url = window.prompt('Link address', 'https://');
    if (!url) return;
    if (!/^(https?:\/\/|mailto:|tel:|\/)/i.test(url)) {
      setNote('Links must start with https://, mailto: or /');
      return;
    }
    setNote('');
    run('createLink', url);
  }

  async function insertImage(file: File) {
    setUploading(true);
    setNote('');
    try {
      const url = await uploadFile(file);
      ref.current?.focus();
      document.execCommand(
        'insertHTML',
        false,
        `<img src="${url.replace(/"/g, '&quot;')}" alt="" />`,
      );
      emit();
    } catch (e) {
      setNote((e as Error).message || 'Could not upload that image.');
    } finally {
      setUploading(false);
    }
  }

  /** A picture with a caption under it, the way an article usually wants one. */
  async function insertFigure(file: File) {
    setUploading(true);
    setNote('');
    try {
      const url = await uploadFile(file);
      const caption = window.prompt('Caption for this picture (leave blank for none)') ?? '';
      ref.current?.focus();
      const safeUrl = url.replace(/"/g, '&quot;');
      const safeCaption = caption
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      document.execCommand(
        'insertHTML',
        false,
        caption.trim()
          ? `<figure><img src="${safeUrl}" alt="" /><figcaption>${safeCaption}</figcaption></figure><p><br></p>`
          : `<img src="${safeUrl}" alt="" /><p><br></p>`,
      );
      emit();
    } catch (e) {
      setNote((e as Error).message || 'Could not upload that image.');
    } finally {
      setUploading(false);
    }
  }

  function insertTable() {
    const cols = Number(window.prompt('How many columns?', '3'));
    const rows = Number(window.prompt('How many rows, not counting the header?', '3'));
    if (!Number.isFinite(cols) || !Number.isFinite(rows) || cols < 1 || rows < 1) return;
    const c = Math.min(cols, 10);
    const r = Math.min(rows, 30);
    const head = `<tr>${'<th>Heading</th>'.repeat(c)}</tr>`;
    const body = `<tr>${'<td>&nbsp;</td>'.repeat(c)}</tr>`.repeat(r);
    ref.current?.focus();
    document.execCommand(
      'insertHTML',
      false,
      `<table><thead>${head}</thead><tbody>${body}</tbody></table><p><br></p>`,
    );
    emit();
  }

  /**
   * A social post is stored as an empty marker div, not the platform's own
   * markup, so a saved article never depends on a script tag surviving the
   * server's sanitising. The article page turns the marker into a real embed.
   */
  function insertEmbed() {
    const url = window.prompt(
      'Paste the link to the post (YouTube, X, Facebook, Instagram, TikTok, Vimeo)',
      'https://',
    );
    if (!url) return;
    if (!/^https:\/\//i.test(url.trim())) {
      setNote('The link must start with https://');
      return;
    }
    setNote('');
    ref.current?.focus();
    document.execCommand(
      'insertHTML',
      false,
      `<div data-embed="${url.trim().replace(/"/g, '&quot;')}"></div><p><br></p>`,
    );
    emit();
  }

  /** Pasted Word and Google Docs markup carries styling that fights the site's own. */
  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    e.preventDefault();
    document.execCommand('insertHTML', false, html ? cleanPastedHtml(html) : escapeText(text));
    emit();
  }

  return (
    <div className="rounded-xl border border-line bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line p-1.5">
        {TOOLS.map((tool, i) =>
          tool.kind === 'divider' ? (
            <span key={`d${i}`} className="mx-1 h-5 w-px bg-line" />
          ) : (
            <button
              key={tool.label}
              type="button"
              title={tool.label}
              aria-label={tool.label}
              disabled={source}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => run(tool.command, tool.arg)}
              className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold text-ink-soft hover:bg-maroon-50 hover:text-maroon-700 disabled:opacity-40"
            >
              {tool.icon ? <Icon name={tool.icon} size={16} /> : tool.text}
            </button>
          ),
        )}

        <span className="mx-1 h-5 w-px bg-line" />
        <button
          type="button"
          title="Link"
          aria-label="Link"
          disabled={source}
          onMouseDown={(e) => e.preventDefault()}
          onClick={addLink}
          className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-ink-soft hover:bg-maroon-50 hover:text-maroon-700 disabled:opacity-40"
        >
          <Icon name="link" size={16} />
        </button>
        <button
          type="button"
          title="Remove link"
          aria-label="Remove link"
          disabled={source}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run('unlink')}
          className="flex h-8 items-center justify-center rounded-lg px-2 text-xs font-semibold text-ink-soft hover:bg-maroon-50 hover:text-maroon-700 disabled:opacity-40"
        >
          Unlink
        </button>

        <label
          title="Insert image"
          className={[
            'flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg px-2 text-ink-soft hover:bg-maroon-50 hover:text-maroon-700',
            source || uploading ? 'pointer-events-none opacity-40' : '',
          ].join(' ')}
        >
          <Icon name="image" size={16} />
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void insertImage(file);
            }}
          />
        </label>

        <label
          title="Picture with a caption"
          className={[
            'flex h-8 items-center justify-center rounded-lg px-2 text-xs font-semibold text-ink-soft hover:bg-maroon-50 hover:text-maroon-700',
            source || uploading ? 'pointer-events-none opacity-40' : 'cursor-pointer',
          ].join(' ')}
        >
          Caption
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void insertFigure(file);
            }}
          />
        </label>
        <button
          type="button"
          title="Embed a social post"
          aria-label="Embed a social post"
          disabled={source}
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertEmbed}
          className="flex h-8 items-center justify-center rounded-lg px-2 text-xs font-semibold text-ink-soft hover:bg-maroon-50 hover:text-maroon-700 disabled:opacity-40"
        >
          Embed
        </button>
        <button
          type="button"
          title="Table"
          aria-label="Table"
          disabled={source}
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertTable}
          className="flex h-8 items-center justify-center rounded-lg px-2 text-xs font-semibold text-ink-soft hover:bg-maroon-50 hover:text-maroon-700 disabled:opacity-40"
        >
          Table
        </button>
        <button
          type="button"
          title="Divider"
          aria-label="Divider"
          disabled={source}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run('insertHorizontalRule')}
          className="flex h-8 items-center justify-center rounded-lg px-2 text-xs font-semibold text-ink-soft hover:bg-maroon-50 hover:text-maroon-700 disabled:opacity-40"
        >
          HR
        </button>
        <button
          type="button"
          title="Clear formatting"
          aria-label="Clear formatting"
          disabled={source}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run('removeFormat')}
          className="flex h-8 items-center justify-center rounded-lg px-2 text-xs font-semibold text-ink-soft hover:bg-maroon-50 hover:text-maroon-700 disabled:opacity-40"
        >
          Clear
        </button>

        <span className="mx-1 h-5 w-px bg-line" />
        <button
          type="button"
          title="Undo"
          aria-label="Undo"
          disabled={source}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run('undo')}
          className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-ink-soft hover:bg-maroon-50 hover:text-maroon-700 disabled:opacity-40"
        >
          <Icon name="refresh" size={15} className="-scale-x-100" />
        </button>
        <button
          type="button"
          title="Redo"
          aria-label="Redo"
          disabled={source}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run('redo')}
          className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-ink-soft hover:bg-maroon-50 hover:text-maroon-700 disabled:opacity-40"
        >
          <Icon name="refresh" size={15} />
        </button>

        <button
          type="button"
          onClick={() => setSource((v) => !v)}
          className={[
            'ml-auto flex h-8 items-center rounded-lg px-2.5 text-xs font-semibold',
            source ? 'bg-maroon-700 text-white' : 'text-ink-soft hover:bg-maroon-50 hover:text-maroon-700',
          ].join(' ')}
        >
          HTML
        </button>
      </div>

      {source ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={18}
          spellCheck={false}
          className="w-full resize-y rounded-b-xl px-4 py-3 font-mono text-xs leading-relaxed text-ink focus:outline-none"
        />
      ) : (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Article body"
          data-placeholder={placeholder ?? 'Write the article…'}
          onInput={emit}
          onBlur={emit}
          onPaste={onPaste}
          className="cps-editor min-h-[22rem] w-full rounded-b-xl px-4 py-3 text-[15px] leading-relaxed text-ink focus:outline-none"
        />
      )}

      {note ? <p className="border-t border-line px-4 py-2 text-xs text-rose-600">{note}</p> : null}
      {uploading ? (
        <p className="border-t border-line px-4 py-2 text-xs text-ink-muted">Uploading image…</p>
      ) : null}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function escapeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/**
 * Articles written before this editor existed are plain text with blank lines
 * between paragraphs. Showing that raw would put the whole piece on one line, so
 * it is converted on the way in and saved back as HTML from then on.
 */
function toHtml(value: string): string {
  if (!value) return '';
  if (/<(p|div|h[1-6]|ul|ol|li|blockquote|img|br|strong|em|a)\b/i.test(value)) return value;
  return escapeText(value);
}

/** Keeps the structure of pasted content and drops the foreign styling. */
function cleanPastedHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|meta|link|o:p)[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|meta|link)\b[^>]*\/?>/gi, '')
    .replace(/\sstyle="[^"]*"/gi, '')
    .replace(/\sclass="[^"]*"/gi, '')
    .replace(/\s(id|lang|dir|width|height|align)="[^"]*"/gi, '')
    .replace(/\son[a-z]+="[^"]*"/gi, '')
    .replace(/<\/?(font|span|o:p)[^>]*>/gi, '');
}
