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
  { kind: 'button', label: 'Heading', text: 'H2', command: 'formatBlock', arg: 'h2' },
  { kind: 'button', label: 'Subheading', text: 'H3', command: 'formatBlock', arg: 'h3' },
  { kind: 'button', label: 'Normal text', text: 'P', command: 'formatBlock', arg: 'p' },
  { kind: 'divider' },
  { kind: 'button', label: 'Bulleted list', text: '•—', command: 'insertUnorderedList' },
  { kind: 'button', label: 'Numbered list', text: '1—', command: 'insertOrderedList' },
  { kind: 'button', label: 'Quote', icon: 'quote', command: 'formatBlock', arg: 'blockquote' },
  { kind: 'divider' },
  { kind: 'button', label: 'Align left', text: 'L', command: 'justifyLeft' },
  { kind: 'button', label: 'Centre', text: 'C', command: 'justifyCenter' },
  { kind: 'button', label: 'Align right', text: 'R', command: 'justifyRight' },
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
