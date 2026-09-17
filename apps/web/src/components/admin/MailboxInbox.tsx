'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon, type IconName } from '@/components/Icon';
import { FileUpload } from '@/components/admin/FileUpload';

/** Largest file the mailbox upload route accepts. */
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

// ── Types mirroring the API responses ────────────────────────────────────────

type Mailbox = {
  id: string;
  address: string;
  displayName: string;
  description?: string | null;
  avatarUrl?: string | null;
  isCatchAll: boolean;
  isActive: boolean;
  sortOrder: number;
  signature?: string | null;
  autoReplyEnabled: boolean;
  autoReplySubject?: string | null;
  autoReplyBody?: string | null;
  members?: MailboxMember[];
};

type MailboxMember = {
  userId: string;
  canSend: boolean;
  canManage: boolean;
  user?: { firstName: string; lastName: string; email: string; avatarUrl?: string | null };
};

/** A file already uploaded, waiting to go out with the next message. */
type OutgoingAttachment = {
  fileName: string;
  url: string;
  mimeType?: string;
  sizeBytes?: number;
};

type ThreadState = 'OPEN' | 'ARCHIVED' | 'SPAM' | 'TRASH';

type ThreadSummary = {
  id: string;
  subject: string;
  snippet: string;
  participant: string;
  participantName?: string | null;
  state: ThreadState;
  isRead: boolean;
  isStarred: boolean;
  messageCount: number;
  hasAttachments: boolean;
  lastMessageAt: string;
  mailbox: { id: string; address: string; displayName: string };
  assignedTo?: { id: string; firstName: string; lastName: string; avatarUrl?: string | null } | null;
};

type Attachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url?: string | null;
  isInline: boolean;
};

type Message = {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  fromName?: string | null;
  fromEmail: string;
  toEmails: string[];
  ccEmails: string[];
  subject: string;
  text?: string | null;
  html?: string | null;
  isSpam: boolean;
  deliveryError?: string | null;
  createdAt: string;
  attachments: Attachment[];
  sentBy?: { firstName: string; lastName: string } | null;
};

type ThreadDetail = ThreadSummary & {
  mailbox: Mailbox;
  messages: Message[];
  /** False for someone given read-only access to this address. */
  canSend?: boolean;
};

type Counts = {
  unread: Record<string, number>;
  totalUnread: number;
  unassigned: number;
  starred: number;
  archived: number;
  spam: number;
  trash: number;
};

type Staff = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
};

type View = { key: string; label: string; icon: IconName };

const VIEWS: View[] = [
  { key: 'inbox', label: 'Inbox', icon: 'inbox' },
  { key: 'starred', label: 'Starred', icon: 'star' },
  { key: 'archived', label: 'Archived', icon: 'archive' },
  { key: 'spam', label: 'Spam', icon: 'shield-check' },
  { key: 'trash', label: 'Trash', icon: 'trash' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

async function api<T>(path: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(`/api/mailbox${path}`, { headers: authHeaders(), ...init }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as T;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString([], sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function initialsOf(name: string, email: string): string {
  const source = (name || email).trim();
  const parts = source.split(/[\s.@]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || source.slice(0, 2).toUpperCase();
}

/**
 * Files and links to go out with a message.
 *
 * The file is uploaded to the school's own storage first and sent as a URL, so
 * a large attachment never travels through this API as base64, and the same
 * file stays viewable on the conversation afterwards.
 */
function AttachmentPicker({
  items,
  onChange,
  disabled,
}: {
  items: OutgoingAttachment[];
  onChange: (next: OutgoingAttachment[]) => void;
  disabled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState('');
  const [linking, setLinking] = useState(false);
  const [link, setLink] = useState('');

  async function pick(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError('');
    const added: OutgoingAttachment[] = [];
    const chosen = Array.from(files);

    for (let i = 0; i < chosen.length; i++) {
      const file = chosen[i];
      setPct(Math.round((i / chosen.length) * 100));
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setError(`${file.name} is over 20 MB. Most mail servers reject that, so attach a link instead.`);
        continue;
      }
      const form = new FormData();
      form.append('file', file);
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
      const res = await fetch('/api/mailbox/attachments', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      }).catch(() => null);

      if (res && res.ok) {
        added.push((await res.json()) as OutgoingAttachment);
      } else {
        const data = res ? await res.json().catch(() => null) : null;
        setError(data?.message ?? `Could not attach ${file.name}.`);
      }
    }

    setBusy(false);
    setPct(0);
    if (fileRef.current) fileRef.current.value = '';
    if (added.length) onChange([...items, ...added]);
  }

  function addLink() {
    const url = link.trim();
    if (!/^https:\/\//i.test(url)) {
      setError('Links must start with https://');
      return;
    }
    const name = decodeURIComponent(url.split('/').pop() || 'link').split('?')[0] || 'link';
    onChange([...items, { fileName: name.slice(0, 120), url }]);
    setLink('');
    setLinking(false);
    setError('');
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || busy}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-maroon-300 hover:text-maroon-700 disabled:opacity-50"
        >
          <Icon name="paperclip" size={14} /> {busy ? `Uploading ${pct}%` : 'Attach file'}
        </button>
        <button
          type="button"
          onClick={() => setLinking((v) => !v)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-maroon-300 hover:text-maroon-700 disabled:opacity-50"
        >
          <Icon name="link" size={14} /> Attach link
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(e) => pick(e.target.files)}
        />
      </div>

      {linking ? (
        <div className="mt-2 flex gap-2">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="flex-1 rounded-xl border border-line px-3 py-1.5 text-sm focus:border-maroon-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={addLink}
            className="rounded-full bg-maroon-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-maroon-800"
          >
            Add
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-1.5 text-xs text-rose-600">{error}</p> : null}

      {items.length ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {items.map((a, i) => (
            <li
              key={`${a.url}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-xs text-ink-soft"
            >
              <Icon name="paperclip" size={12} />
              <span className="max-w-[14rem] truncate">{a.fileName}</span>
              {a.sizeBytes ? <span className="text-ink-muted">{formatBytes(a.sizeBytes)}</span> : null}
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                aria-label={`Remove ${a.fileName}`}
                className="rounded-full p-0.5 text-ink-muted hover:text-rose-600"
              >
                <Icon name="close" size={12} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** A small round face, falling back to initials. */
function Avatar({
  name,
  email,
  url,
  size = 28,
}: {
  name?: string | null;
  email?: string | null;
  url?: string | null;
  size?: number;
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      className="flex shrink-0 items-center justify-center rounded-full bg-maroon-700 font-semibold text-white"
    >
      {initialsOf(name ?? '', email ?? '')}
    </span>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export function MailboxInbox() {
  const [tab, setTab] = useState<'inbox' | 'addresses' | 'setup'>('inbox');
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [notice, setNotice] = useState('');

  const loadSidebar = useCallback(async () => {
    const [boxes, c, s] = await Promise.all([
      api<Mailbox[]>('/mailboxes'),
      api<Counts>('/counts'),
      api<Staff[]>('/staff'),
    ]);
    if (boxes) setMailboxes(boxes);
    else setNotice('Sign in as an administrator to read school mail.');
    if (c) setCounts(c);
    if (s) setStaff(s);
  }, []);

  useEffect(() => {
    void loadSidebar();
  }, [loadSidebar]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-maroon-900">Mailbox</h1>
          <p className="mt-1 text-sm text-ink-soft">
            School email delivered straight into this portal. {notice}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-line bg-paper p-1">
          {([
            ['inbox', 'Inbox'],
            ['addresses', 'Addresses'],
            ['setup', 'Setup'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={[
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                tab === key ? 'bg-maroon-700 text-white' : 'text-ink-soft hover:text-maroon-700',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'inbox' ? (
        <InboxPane mailboxes={mailboxes} counts={counts} staff={staff} onChanged={loadSidebar} />
      ) : tab === 'addresses' ? (
        <AddressesPane mailboxes={mailboxes} staff={staff} onChanged={loadSidebar} />
      ) : (
        <SetupPane mailboxCount={mailboxes.length} />
      )}
    </>
  );
}

// ── Inbox ────────────────────────────────────────────────────────────────────

function InboxPane({
  mailboxes,
  counts,
  staff,
  onChanged,
}: {
  mailboxes: Mailbox[];
  counts: Counts | null;
  staff: Staff[];
  onChanged: () => void;
}) {
  const [view, setView] = useState('inbox');
  const [mailboxId, setMailboxId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (mailboxId) p.set('mailboxId', mailboxId);
    if (debounced) p.set('search', debounced);
    if (view === 'starred') p.set('starred', 'true');
    else if (view === 'archived') p.set('state', 'ARCHIVED');
    else if (view === 'spam') p.set('state', 'SPAM');
    else if (view === 'trash') p.set('state', 'TRASH');
    else p.set('state', 'OPEN');
    return p.toString();
  }, [mailboxId, debounced, view]);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    const data = await api<{ items: ThreadSummary[]; total: number }>(`/threads?${query}`);
    setThreads(data?.items ?? []);
    setTotal(data?.total ?? 0);
    setLoading(false);
  }, [query]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  const refreshAll = useCallback(() => {
    void loadThreads();
    onChanged();
  }, [loadThreads, onChanged]);

  return (
    <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,340px)_minmax(0,1fr)]">
      {/* Folders */}
      <aside className="space-y-4">
        <button
          type="button"
          onClick={() => setComposing(true)}
          disabled={mailboxes.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-maroon-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-maroon-800 disabled:opacity-40"
        >
          <Icon name="edit" size={16} /> Compose
        </button>

        <nav className="space-y-0.5" aria-label="Folders">
          {VIEWS.map((v) => {
            const badge =
              v.key === 'inbox'
                ? counts?.totalUnread
                : v.key === 'starred'
                  ? counts?.starred
                  : v.key === 'archived'
                    ? counts?.archived
                    : v.key === 'spam'
                      ? counts?.spam
                      : counts?.trash;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => {
                  setView(v.key);
                  setOpenId(null);
                }}
                className={[
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  view === v.key ? 'bg-maroon-50 text-maroon-800' : 'text-ink-soft hover:bg-paper-dark/50',
                ].join(' ')}
              >
                <Icon name={v.icon} size={17} />
                <span className="flex-1 text-left">{v.label}</span>
                {badge ? (
                  <span className="rounded-full bg-maroon-700 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    {badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div>
          <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Addresses
          </p>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setMailboxId(null)}
              className={[
                'w-full truncate rounded-xl px-3 py-2 text-left text-sm',
                mailboxId === null ? 'bg-paper-dark/60 font-medium text-ink' : 'text-ink-soft hover:bg-paper-dark/40',
              ].join(' ')}
            >
              All addresses
            </button>
            {mailboxes.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMailboxId(m.id)}
                title={m.address}
                className={[
                  'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm',
                  mailboxId === m.id ? 'bg-paper-dark/60 font-medium text-ink' : 'text-ink-soft hover:bg-paper-dark/40',
                ].join(' ')}
              >
                <span className="min-w-0 flex-1 truncate">{m.address.split('@')[0]}</span>
                {counts?.unread?.[m.id] ? (
                  <span className="shrink-0 rounded-full bg-gold-400 px-1.5 py-0.5 text-[11px] font-semibold text-maroon-900">
                    {counts.unread[m.id]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Conversation list */}
      <section className="min-w-0 rounded-2xl border border-line bg-white">
        <div className="border-b border-line p-3">
          <div className="relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mail"
              className="w-full rounded-full border border-line bg-paper py-2 pl-9 pr-3 text-sm focus:border-maroon-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="max-h-[calc(100vh-19rem)] min-h-[20rem] overflow-y-auto">
          {loading ? (
            <p className="p-5 text-sm text-ink-muted">Loading…</p>
          ) : threads.length === 0 ? (
            <p className="p-5 text-sm text-ink-muted">
              {debounced ? 'Nothing matches that search.' : 'No conversations here yet.'}
            </p>
          ) : (
            <ul>
              {threads.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(t.id)}
                    className={[
                      'flex w-full gap-3 border-b border-line/70 px-4 py-3 text-left transition-colors',
                      openId === t.id ? 'bg-maroon-50/70' : 'hover:bg-paper-dark/30',
                      t.isRead ? '' : 'bg-white',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                        t.isRead ? 'bg-paper-dark text-ink-soft' : 'bg-maroon-700 text-white',
                      ].join(' ')}
                    >
                      {initialsOf(t.participantName ?? '', t.participant)}
                    </span>
                    <span className="sr-only">{t.isRead ? 'Read' : 'Unread'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={['truncate text-sm', t.isRead ? 'text-ink-soft' : 'font-semibold text-ink'].join(' ')}>
                          {t.participantName || t.participant}
                        </span>
                        <span className="shrink-0 text-[11px] text-ink-muted">{formatWhen(t.lastMessageAt)}</span>
                      </span>
                      <span className={['mt-0.5 block truncate text-sm', t.isRead ? 'text-ink-soft' : 'font-medium text-ink'].join(' ')}>
                        {t.subject}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-muted">{t.snippet}</span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-paper-dark px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                          {t.mailbox.address.split('@')[0]}
                        </span>
                        {t.messageCount > 1 ? (
                          <span className="text-[10px] text-ink-muted">{t.messageCount} messages</span>
                        ) : null}
                        {t.hasAttachments ? <Icon name="paperclip" size={12} className="text-ink-muted" /> : null}
                        {t.isStarred ? <Icon name="star" size={12} className="text-gold-500" /> : null}
                        {t.assignedTo ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 py-0.5 pl-0.5 pr-2 text-[10px] font-medium text-emerald-700">
                            <Avatar
                              name={`${t.assignedTo.firstName} ${t.assignedTo.lastName}`}
                              url={t.assignedTo.avatarUrl}
                              size={14}
                            />
                            {t.assignedTo.firstName}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {total > threads.length ? (
          <p className="border-t border-line px-4 py-2 text-xs text-ink-muted">
            Showing {threads.length} of {total}. Narrow it with search.
          </p>
        ) : null}
      </section>

      {/* Conversation */}
      <section className="min-w-0">
        {openId ? (
          <ThreadView
            key={openId}
            threadId={openId}
            staff={staff}
            onChanged={refreshAll}
            onClose={() => setOpenId(null)}
          />
        ) : (
          <div className="flex h-full min-h-[24rem] items-center justify-center rounded-2xl border border-dashed border-line bg-paper/50 p-8 text-center">
            <div>
              <Icon name="at-sign" size={30} className="mx-auto text-maroon-300" />
              <p className="mt-3 text-sm text-ink-soft">Select a conversation to read it.</p>
            </div>
          </div>
        )}
      </section>

      {composing ? (
        <ComposeDialog
          mailboxes={mailboxes}
          onClose={() => setComposing(false)}
          onSent={() => {
            setComposing(false);
            refreshAll();
          }}
        />
      ) : null}
    </div>
  );
}

// ── One conversation ─────────────────────────────────────────────────────────

function ThreadView({
  threadId,
  staff,
  onChanged,
  onClose,
}: {
  threadId: string;
  staff: Staff[];
  onChanged: () => void;
  onClose: () => void;
}) {
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [files, setFiles] = useState<OutgoingAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setThread(await api<ThreadDetail>(`/threads/${threadId}`));
    setLoading(false);
  }, [threadId]);

  useEffect(() => {
    void load();
  }, [load]);

  // The API answers a flag change with the bare thread row, so only the flags
  // are merged back; the mailbox and messages already loaded stay as they are.
  async function patch(body: Record<string, unknown>) {
    const updated = await api<{ isRead: boolean; isStarred: boolean; state: ThreadState }>(
      `/threads/${threadId}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    );
    if (updated) {
      setThread((t) =>
        t ? { ...t, isRead: updated.isRead, isStarred: updated.isStarred, state: updated.state } : t,
      );
      onChanged();
    }
  }

  async function assign(userId: string) {
    await api(`/threads/${threadId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedToId: userId || null }),
    });
    await load();
    onChanged();
  }

  async function send() {
    if (reply.trim().length < 1) return;
    setSending(true);
    setError('');
    const res = await fetch(`/api/mailbox/threads/${threadId}/reply`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ body: reply, attachments: files.length ? files : undefined }),
    }).catch(() => null);
    const data = res && res.ok ? ((await res.json()) as { sent: boolean; error?: string }) : null;
    setSending(false);

    if (data?.sent) {
      setReply('');
      setFiles([]);
      await load();
      onChanged();
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // The reply is still saved on the thread, so say what went wrong rather
      // than losing what was typed.
      setError(
        data?.error === 'SMTP not configured'
          ? 'Sending is not connected yet. Add SMTP details under Integrations, then send again.'
          : `Could not send: ${data?.error ?? 'please try again'}.`,
      );
      await load();
    }
  }

  async function remove() {
    if (!confirm('Delete this conversation permanently? This cannot be undone.')) return;
    await api(`/threads/${threadId}`, { method: 'DELETE' });
    onChanged();
    onClose();
  }

  if (loading) {
    return <div className="rounded-2xl border border-line bg-white p-6 text-sm text-ink-muted">Loading…</div>;
  }
  if (!thread) {
    return <div className="rounded-2xl border border-line bg-white p-6 text-sm text-ink-muted">Conversation not found.</div>;
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-white">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-4">
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg text-maroon-900">{thread.subject}</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            {thread.participantName ? `${thread.participantName}, ` : ''}
            {thread.participant} to {thread.mailbox.address}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconButton
            label={thread.isStarred ? 'Remove star' : 'Star'}
            icon="star"
            active={thread.isStarred}
            onClick={() => patch({ isStarred: !thread.isStarred })}
          />
          <IconButton label="Mark unread" icon="eye" onClick={() => { void patch({ isRead: false }); onClose(); }} />
          {thread.state !== 'ARCHIVED' ? (
            <IconButton label="Archive" icon="archive" onClick={() => patch({ state: 'ARCHIVED' })} />
          ) : (
            <IconButton label="Move to inbox" icon="inbox" onClick={() => patch({ state: 'OPEN' })} />
          )}
          {thread.state !== 'SPAM' ? (
            <IconButton label="Mark spam" icon="shield-check" onClick={() => patch({ state: 'SPAM' })} />
          ) : (
            <IconButton label="Not spam" icon="inbox" onClick={() => patch({ state: 'OPEN' })} />
          )}
          <IconButton label="Delete" icon="trash" danger onClick={remove} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-ink-muted hover:bg-paper-dark/50 lg:hidden"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper/60 px-4 py-2">
        <label htmlFor="assignee" className="text-xs font-medium text-ink-soft">
          Assigned to
        </label>
        <select
          id="assignee"
          value={thread.assignedTo?.id ?? ''}
          onChange={(e) => assign(e.target.value)}
          className="rounded-full border border-line bg-white px-3 py-1 text-xs text-ink focus:border-maroon-500 focus:outline-none"
        >
          <option value="">Nobody</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.firstName} {s.lastName}
            </option>
          ))}
        </select>
        {thread.state === 'SPAM' ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            In spam
          </span>
        ) : null}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 30rem)' }}>
        {thread.messages.map((m) => (
          <MessageCard key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-line p-4">
        {thread.canSend === false ? (
          <p className="rounded-xl bg-paper-dark/40 px-4 py-3 text-sm text-ink-soft">
            You have read-only access to {thread.mailbox.address}. Ask a super admin for permission
            to send if you need to answer from it.
          </p>
        ) : (
        <>
        <label htmlFor="reply" className="mb-1.5 block text-sm font-medium text-ink">
          Reply as {thread.mailbox.address}
        </label>
        <textarea
          id="reply"
          rows={4}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={`Type your reply to ${thread.participantName || thread.participant}…`}
          className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink shadow-sm focus:border-maroon-500 focus:outline-none focus:ring-2 focus:ring-maroon-500/20"
        />
        <AttachmentPicker items={files} onChange={setFiles} disabled={sending} />
        {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={send}
            disabled={sending || reply.trim().length < 1}
            className="inline-flex items-center gap-1.5 rounded-full bg-maroon-700 px-5 py-2 text-sm font-medium text-white hover:bg-maroon-800 disabled:opacity-50"
          >
            <Icon name="send" size={15} /> {sending ? 'Sending…' : 'Send reply'}
          </button>
          {thread.mailbox.signature ? (
            <span className="text-xs text-ink-muted">Signature will be added.</span>
          ) : null}
        </div>
        </>
        )}
      </div>
    </div>
  );
}

function MessageCard({ message }: { message: Message }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const outbound = message.direction === 'OUTBOUND';

  return (
    <article
      className={[
        'rounded-2xl border p-4',
        outbound ? 'border-maroon-700/20 bg-maroon-50/40' : 'border-line bg-paper/40',
      ].join(' ')}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">
            {message.fromName || message.fromEmail}
            {outbound ? (
              <span className="ml-2 rounded-full bg-maroon-700 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                Sent
              </span>
            ) : null}
          </p>
          <p className="truncate text-xs text-ink-muted">
            {message.fromEmail} to {message.toEmails.join(', ')}
            {message.ccEmails.length ? ` (cc ${message.ccEmails.join(', ')})` : ''}
          </p>
        </div>
        <time className="shrink-0 text-xs text-ink-muted" dateTime={message.createdAt}>
          {new Date(message.createdAt).toLocaleString()}
        </time>
      </header>

      {message.deliveryError ? (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          Not delivered: {message.deliveryError}. The text is kept here so nothing is lost.
        </p>
      ) : null}

      <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
        {message.text || '(no text content)'}
      </div>

      {message.html ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowOriginal((v) => !v)}
            className="text-xs font-medium text-maroon-700 hover:underline"
          >
            {showOriginal ? 'Hide original formatting' : 'Show original formatting'}
          </button>
          {showOriginal ? (
            // Sender HTML is untrusted, so it renders inside a sandboxed frame
            // with scripts disabled rather than into this page.
            <iframe
              title="Original message"
              sandbox=""
              srcDoc={message.html}
              className="mt-2 h-80 w-full rounded-xl border border-line bg-white"
            />
          ) : null}
        </div>
      ) : null}

      {message.attachments.filter((a) => !a.isInline).length ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
          {message.attachments
            .filter((a) => !a.isInline)
            .map((a) =>
              a.url ? (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs text-ink-soft hover:border-maroon-300 hover:text-maroon-700"
                >
                  <Icon name="paperclip" size={13} /> {a.fileName}
                  <span className="text-ink-muted">{formatBytes(a.sizeBytes)}</span>
                </a>
              ) : (
                <span
                  key={a.id}
                  title="File storage was not configured when this arrived."
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-3 py-1.5 text-xs text-ink-muted"
                >
                  <Icon name="paperclip" size={13} /> {a.fileName} (not stored)
                </span>
              ),
            )}
        </div>
      ) : null}
    </article>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  active,
  danger,
}: {
  label: string;
  icon: IconName;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={[
        'rounded-lg p-2 transition-colors',
        active ? 'text-gold-500' : 'text-ink-muted',
        danger ? 'hover:bg-rose-50 hover:text-rose-600' : 'hover:bg-maroon-50 hover:text-maroon-700',
      ].join(' ')}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}

// ── Compose ──────────────────────────────────────────────────────────────────

function ComposeDialog({
  mailboxes,
  onClose,
  onSent,
}: {
  mailboxes: Mailbox[];
  onClose: () => void;
  onSent: () => void;
}) {
  const [mailboxId, setMailboxId] = useState(mailboxes[0]?.id ?? '');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<OutgoingAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function send() {
    setSending(true);
    setError('');
    const recipients = to
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch('/api/mailbox/compose', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        mailboxId,
        to: recipients,
        subject,
        body,
        attachments: files.length ? files : undefined,
      }),
    }).catch(() => null);
    const data = res && res.ok ? ((await res.json()) as { sent: boolean; error?: string }) : null;
    setSending(false);
    if (data?.sent) onSent();
    else setError(data?.error ?? 'Could not send. Check the addresses and try again.');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div className="w-full max-w-xl rounded-2xl border border-line bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-display text-lg text-maroon-900">New message</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-ink-muted hover:bg-paper-dark/50">
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="space-y-3 p-5">
          <div>
            <label htmlFor="c-from" className="mb-1 block text-xs font-medium text-ink-soft">Send from</label>
            <select
              id="c-from"
              value={mailboxId}
              onChange={(e) => setMailboxId(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:border-maroon-500 focus:outline-none"
            >
              {mailboxes.map((m) => (
                <option key={m.id} value={m.id}>{m.address}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="c-to" className="mb-1 block text-xs font-medium text-ink-soft">To</label>
            <input
              id="c-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="parent@example.com, another@example.com"
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:border-maroon-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="c-subject" className="mb-1 block text-xs font-medium text-ink-soft">Subject</label>
            <input
              id="c-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:border-maroon-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="c-body" className="mb-1 block text-xs font-medium text-ink-soft">Message</label>
            <textarea
              id="c-body"
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:border-maroon-500 focus:outline-none"
            />
            <AttachmentPicker items={files} onChange={setFiles} disabled={sending} />
          </div>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>
        <footer className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-ink-muted hover:text-ink">Cancel</button>
          <button
            type="button"
            onClick={send}
            disabled={sending || !mailboxId || !to.trim() || !subject.trim() || !body.trim()}
            className="inline-flex items-center gap-1.5 rounded-full bg-maroon-700 px-5 py-2 text-sm font-medium text-white hover:bg-maroon-800 disabled:opacity-50"
          >
            <Icon name="send" size={15} /> {sending ? 'Sending…' : 'Send'}
          </button>
        </footer>
      </div>
    </div>
  );
}

// ── Addresses ────────────────────────────────────────────────────────────────

const EMPTY_MAILBOX = {
  address: '',
  displayName: 'City Parents School',
  description: '',
  avatarUrl: '',
  isCatchAll: false,
  isActive: true,
  signature: '',
  autoReplyEnabled: false,
  autoReplySubject: '',
  autoReplyBody: '',
};

function AddressesPane({
  mailboxes,
  staff,
  onChanged,
}: {
  mailboxes: Mailbox[];
  staff: Staff[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<Partial<Mailbox> | null>(null);
  const [members, setMembers] = useState<MailboxMember[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function open(mailbox: Partial<Mailbox>) {
    setEditing(mailbox);
    setMembers(mailbox.members ?? []);
    setError('');
  }

  function setAccess(userId: string, on: boolean) {
    setMembers((prev) =>
      on
        ? [...prev, { userId, canSend: true, canManage: false }]
        : prev.filter((m) => m.userId !== userId),
    );
  }

  function setCanSend(userId: string, canSend: boolean) {
    setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, canSend } : m)));
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError('');
    const isNew = !editing.id;
    const payload = {
      address: editing.address?.trim().toLowerCase(),
      displayName: editing.displayName?.trim(),
      description: editing.description || undefined,
      avatarUrl: editing.avatarUrl || undefined,
      isCatchAll: Boolean(editing.isCatchAll),
      isActive: editing.isActive !== false,
      signature: editing.signature || undefined,
      autoReplyEnabled: Boolean(editing.autoReplyEnabled),
      autoReplySubject: editing.autoReplySubject || undefined,
      autoReplyBody: editing.autoReplyBody || undefined,
    };
    const res = await fetch(isNew ? '/api/mailbox/mailboxes' : `/api/mailbox/mailboxes/${editing.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).catch(() => null);
    if (!res || !res.ok) {
      setSaving(false);
      const data = res ? await res.json().catch(() => null) : null;
      setError(data?.message ?? 'Could not save this address.');
      return;
    }

    // A new address has no id until it is saved, so who may use it is written
    // in a second call once the id exists.
    const saved = (await res.json()) as Mailbox;
    const memberRes = await fetch(`/api/mailbox/mailboxes/${saved.id}/members`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        members: members.map((m) => ({
          userId: m.userId,
          canSend: m.canSend,
          canManage: m.canManage,
        })),
      }),
    }).catch(() => null);

    setSaving(false);
    if (!memberRes || !memberRes.ok) {
      setError('The address was saved, but who may use it was not. Try that part again.');
      onChanged();
      return;
    }
    setEditing(null);
    onChanged();
  }

  async function remove(m: Mailbox) {
    if (!confirm(`Delete ${m.address}? Every conversation in it is deleted too.`)) return;
    await fetch(`/api/mailbox/mailboxes/${m.id}`, { method: 'DELETE', headers: authHeaders() }).catch(() => null);
    onChanged();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-ink-soft">
          Every address here receives mail as soon as the domain points at this portal. Adding
          another one needs no DNS change and no extra cost.
        </p>
        <button
          type="button"
          onClick={() => open({ ...EMPTY_MAILBOX })}
          className="inline-flex items-center gap-1.5 rounded-full bg-maroon-700 px-4 py-2 text-sm font-medium text-white hover:bg-maroon-800"
        >
          <Icon name="plus" size={16} /> New address
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {mailboxes.map((m) => (
          <div key={m.id} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{m.address}</p>
                <p className="truncate text-xs text-ink-muted">{m.displayName}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <IconButton label="Edit" icon="edit" onClick={() => open(m)} />
                <IconButton label="Delete" icon="trash" danger onClick={() => remove(m)} />
              </div>
            </div>
            {m.description ? <p className="mt-2 text-sm text-ink-soft">{m.description}</p> : null}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {m.isCatchAll ? (
                <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-semibold text-maroon-800">Catch-all</span>
              ) : null}
              {m.autoReplyEnabled ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Auto-reply</span>
              ) : null}
              <span
                className={[
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  m.isActive ? 'bg-paper-dark text-ink-soft' : 'bg-rose-50 text-rose-600',
                ].join(' ')}
              >
                {m.isActive ? 'Active' : 'Paused'}
              </span>
            </div>
            {m.members?.length ? (
              <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3">
                {m.members.slice(0, 5).map((mem) => (
                  <span key={mem.userId} title={`${mem.user?.firstName ?? ''} ${mem.user?.lastName ?? ''}`.trim()}>
                    <Avatar
                      name={`${mem.user?.firstName ?? ''} ${mem.user?.lastName ?? ''}`}
                      email={mem.user?.email}
                      url={mem.user?.avatarUrl}
                      size={24}
                    />
                  </span>
                ))}
                <span className="ml-1 text-xs text-ink-muted">
                  {m.members.length === 1 ? '1 person' : `${m.members.length} people`}
                </span>
              </div>
            ) : (
              <p className="mt-3 border-t border-line pt-3 text-xs text-ink-muted">
                Only super admins can see this address.
              </p>
            )}
          </div>
        ))}
        {mailboxes.length === 0 ? (
          <p className="text-sm text-ink-muted">No addresses yet. Create the first one.</p>
        ) : null}
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-line px-5 py-3">
              <h2 className="font-display text-lg text-maroon-900">
                {editing.id ? 'Edit address' : 'New address'}
              </h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="rounded-lg p-1.5 text-ink-muted hover:bg-paper-dark/50">
                <Icon name="close" size={18} />
              </button>
            </header>
            <div className="space-y-3 p-5">
              <Field label="Address" hint="For example admissions@cityparentsschool.co.ug">
                <input
                  value={editing.address ?? ''}
                  onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm focus:border-maroon-500 focus:outline-none"
                />
              </Field>
              <Field label="Display name" hint="The name parents see on replies">
                <input
                  value={editing.displayName ?? ''}
                  onChange={(e) => setEditing({ ...editing, displayName: e.target.value })}
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm focus:border-maroon-500 focus:outline-none"
                />
              </Field>
              <Field label="Description">
                <input
                  value={editing.description ?? ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm focus:border-maroon-500 focus:outline-none"
                />
              </Field>
              <Field
                label="Sender picture"
                hint="Shown at the top of every message sent from this address. Most mail apps only display it once the reader allows images."
              >
                <div className="flex items-start gap-3">
                  {editing.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editing.avatarUrl}
                      alt=""
                      className="mt-1 h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <FileUpload
                      label=""
                      value={editing.avatarUrl ?? ''}
                      onChange={(url) => setEditing({ ...editing, avatarUrl: url })}
                      accept="image/*"
                    />
                  </div>
                </div>
              </Field>
              <Field label="Signature" hint="Added to the bottom of every reply sent from here">
                <textarea
                  rows={3}
                  value={editing.signature ?? ''}
                  onChange={(e) => setEditing({ ...editing, signature: e.target.value })}
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm focus:border-maroon-500 focus:outline-none"
                />
              </Field>
              <Toggle
                label="Receive mail for any unmatched address"
                checked={Boolean(editing.isCatchAll)}
                onChange={(v) => setEditing({ ...editing, isCatchAll: v })}
              />
              <Toggle
                label="Active"
                checked={editing.isActive !== false}
                onChange={(v) => setEditing({ ...editing, isActive: v })}
              />
              <Toggle
                label="Send an automatic acknowledgement"
                checked={Boolean(editing.autoReplyEnabled)}
                onChange={(v) => setEditing({ ...editing, autoReplyEnabled: v })}
              />
              <div className="border-t border-line pt-3">
                <p className="mb-1 text-xs font-medium text-ink-soft">Who works in this address</p>
                <p className="mb-2 text-xs text-ink-muted">
                  Super admins always have access. Anyone ticked here sees this address in their own
                  Mailbox and nothing else.
                </p>
                <div className="space-y-1.5">
                  {staff.length === 0 ? (
                    <p className="text-xs text-ink-muted">
                      No staff accounts yet. Create them under Staff and Access.
                    </p>
                  ) : (
                    staff.map((person) => {
                      const member = members.find((m) => m.userId === person.id);
                      return (
                        <div
                          key={person.id}
                          className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-2"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(member)}
                            onChange={(e) => setAccess(person.id, e.target.checked)}
                            aria-label={`Give ${person.firstName} access`}
                            className="h-4 w-4 rounded border-line text-maroon-700 focus:ring-maroon-500"
                          />
                          <Avatar
                            name={`${person.firstName} ${person.lastName}`}
                            email={person.email}
                            url={person.avatarUrl}
                            size={26}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-ink">
                              {person.firstName} {person.lastName}
                            </span>
                            <span className="block truncate text-xs text-ink-muted">{person.email}</span>
                          </span>
                          {member ? (
                            <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                              <input
                                type="checkbox"
                                checked={member.canSend}
                                onChange={(e) => setCanSend(person.id, e.target.checked)}
                                className="h-3.5 w-3.5 rounded border-line text-maroon-700 focus:ring-maroon-500"
                              />
                              Can send
                            </label>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {editing.autoReplyEnabled ? (
                <>
                  <Field label="Auto-reply subject">
                    <input
                      value={editing.autoReplySubject ?? ''}
                      onChange={(e) => setEditing({ ...editing, autoReplySubject: e.target.value })}
                      placeholder="We received your message"
                      className="w-full rounded-xl border border-line px-3 py-2 text-sm focus:border-maroon-500 focus:outline-none"
                    />
                  </Field>
                  <Field label="Auto-reply message" hint="Sent once, only on the first message of a conversation">
                    <textarea
                      rows={4}
                      value={editing.autoReplyBody ?? ''}
                      onChange={(e) => setEditing({ ...editing, autoReplyBody: e.target.value })}
                      className="w-full rounded-xl border border-line px-3 py-2 text-sm focus:border-maroon-500 focus:outline-none"
                    />
                  </Field>
                </>
              ) : null}
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-ink-muted hover:text-ink">Cancel</button>
              <button
                type="button"
                onClick={save}
                disabled={saving || !editing.address?.trim() || !editing.displayName?.trim()}
                className="rounded-full bg-maroon-700 px-5 py-2 text-sm font-medium text-white hover:bg-maroon-800 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save address'}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-soft">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-line text-maroon-700 focus:ring-maroon-500"
      />
      {label}
    </label>
  );
}

// ── Setup ────────────────────────────────────────────────────────────────────

function SetupPane({ mailboxCount }: { mailboxCount: number }) {
  const [status, setStatus] = useState<{
    inboundReady: boolean;
    sendingReady: boolean;
    webhookPath: string;
    webhookUrl: string | null;
  } | null>(null);
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api<typeof status>('/setup').then(setStatus);
  }, []);

  async function rotate() {
    if (status?.inboundReady && !confirm('Generate a new secret? The Worker must be updated with it or mail stops arriving.')) return;
    setBusy(true);
    const data = await api<{ secret: string }>('/setup/secret', { method: 'POST' });
    setBusy(false);
    if (data?.secret) {
      setSecret(data.secret);
      setStatus((s) => (s ? { ...s, inboundReady: true } : s));
    }
  }

  // The API's own origin when it knows it, otherwise this site's (which proxies
  // through to the same endpoint and works just as well for normal mail).
  // "Ready" has to mean mail would actually land somewhere. A secret with no
  // addresses behind it bounces every message, which looks identical to a
  // broken webhook from the outside.
  const receiving = !status?.inboundReady
    ? 'Not set up'
    : mailboxCount === 0
      ? 'No addresses yet'
      : 'Ready';
  const receivingOk = Boolean(status?.inboundReady) && mailboxCount > 0;

  const webhookUrl =
    status?.webhookUrl ??
    (typeof window !== 'undefined'
      ? `${window.location.origin}${status?.webhookPath ?? '/api/mailbox/inbound'}`
      : '');

  return (
    <div className="max-w-3xl space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatusTile label="Addresses" value={String(mailboxCount)} ok={mailboxCount > 0} />
        <StatusTile label="Receiving" value={receiving} ok={receivingOk} />
        <StatusTile label="Sending" value={status?.sendingReady ? 'Ready' : 'Not connected'} ok={Boolean(status?.sendingReady)} />
      </div>

      {status && status.inboundReady && mailboxCount === 0 ? (
        <p className="rounded-2xl border border-gold-300 bg-gold-50 p-4 text-sm text-maroon-900">
          The webhook is connected, but no addresses exist yet, so there is nothing to deliver
          mail to. Anything sent to the school right now is bounced back to the sender. Open the
          Addresses tab and create the addresses you routed in Cloudflare.
        </p>
      ) : null}

      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg text-maroon-900">Connect incoming mail</h2>
        <ol className="mt-3 space-y-4 text-sm text-ink-soft">
          <li>
            <p className="font-medium text-ink">1. Generate the webhook secret</p>
            <p className="mt-1">This portal only accepts mail from a caller holding this secret.</p>
            <button
              type="button"
              onClick={rotate}
              disabled={busy}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-maroon-700 px-4 py-1.5 text-sm font-medium text-maroon-700 hover:bg-maroon-50 disabled:opacity-50"
            >
              <Icon name="refresh" size={15} />
              {status?.inboundReady ? 'Generate a new secret' : 'Generate secret'}
            </button>
            {secret ? (
              <div className="mt-2 rounded-xl border border-gold-300 bg-gold-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-maroon-800">
                  Copy this now, it is shown once
                </p>
                <code className="mt-1 block break-all font-mono text-sm text-ink">{secret}</code>
              </div>
            ) : null}
          </li>
          <li>
            <p className="font-medium text-ink">2. Point Cloudflare Email Routing at this URL</p>
            <code className="mt-1 block break-all rounded-lg bg-paper-dark/60 px-3 py-2 font-mono text-xs text-ink">
              {webhookUrl}
            </code>
            <p className="mt-1">
              Create a Cloudflare Worker with the code in docs/cloudflare-email-worker.js, set
              PORTAL_WEBHOOK_URL and PORTAL_SECRET on it, then route each address to that Worker.
            </p>
          </li>
          <li>
            <p className="font-medium text-ink">3. Connect sending</p>
            <p className="mt-1">
              Replies leave through the SMTP details under Integrations. Until that is set, replies
              are saved on the conversation but not delivered.
            </p>
          </li>
        </ol>
      </section>
    </div>
  );
}

function StatusTile({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">{label}</p>
      <p className={['mt-1 text-lg font-semibold', ok ? 'text-emerald-700' : 'text-ink-soft'].join(' ')}>{value}</p>
    </div>
  );
}
