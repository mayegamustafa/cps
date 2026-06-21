'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';

type Message = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  handled: boolean;
  createdAt: string;
};

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

export function ContactInbox() {
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyNote, setReplyNote] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/contact', { headers: authHeaders() }).catch(() => null);
    if (res && res.ok) setItems(await res.json());
    else setMsg('Sign in to view messages.');
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function setHandled(id: string, handled: boolean) {
    const res = await fetch(`/api/contact/${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ handled }) }).catch(() => null);
    if (res && res.ok) setItems((p) => p.map((m) => (m.id === id ? { ...m, handled } : m)));
  }

  function openReply(id: string) {
    setReplyTo((cur) => (cur === id ? null : id));
    setReplyText('');
    setReplyNote('');
  }

  async function sendReply(id: string) {
    if (replyText.trim().length < 2) return;
    setSending(true);
    setReplyNote('');
    const res = await fetch(`/api/contact/${id}/reply`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ message: replyText }),
    }).catch(() => null);
    const data = res && res.ok ? await res.json() : null;
    setSending(false);
    if (data?.sent) {
      setItems((p) => p.map((m) => (m.id === id ? { ...m, handled: true } : m)));
      setReplyTo(null);
      setReplyText('');
    } else {
      setReplyNote(data?.error === 'SMTP not configured'
        ? 'Email is not configured yet — set up SMTP under Integrations, or use the mail icon to reply from your own client.'
        : `Could not send: ${data?.error ?? 'try again'}.`);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this message?')) return;
    const res = await fetch(`/api/contact/${id}`, { method: 'DELETE', headers: authHeaders() }).catch(() => null);
    if (res && res.ok) setItems((p) => p.filter((m) => m.id !== id));
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-2xl text-maroon-900">Contact messages</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Enquiries submitted through the public contact form. {msg}
        </p>
      </div>

      {loading ? (
        <p className="text-ink-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-ink-muted">No messages yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <div key={m.id} className={`rounded-2xl border p-5 ${m.handled ? 'border-line bg-paper-dark/30' : 'border-maroon-700/20 bg-white'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ink">{m.name}</h3>
                    {m.handled ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Handled</span>
                    ) : (
                      <span className="rounded-full bg-maroon-50 px-2 py-0.5 text-xs font-semibold text-maroon-700">New</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {m.email}{m.phone ? ` · ${m.phone}` : ''} · {new Date(m.createdAt).toLocaleString()}
                  </p>
                  {m.subject ? <p className="mt-2 text-sm font-medium text-ink">{m.subject}</p> : null}
                  <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">{m.message}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => openReply(m.id)} aria-label="Reply" className="rounded-lg p-2 text-ink-muted hover:bg-maroon-50 hover:text-maroon-700">
                    <Icon name="mail" size={18} />
                  </button>
                  <button onClick={() => setHandled(m.id, !m.handled)} aria-label="Toggle handled" className="rounded-lg p-2 text-ink-muted hover:bg-emerald-50 hover:text-emerald-700">
                    <Icon name="shield-check" size={18} />
                  </button>
                  <button onClick={() => remove(m.id)} aria-label="Delete" className="rounded-lg p-2 text-ink-muted hover:bg-rose-50 hover:text-rose-600">
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              </div>

              {replyTo === m.id ? (
                <div className="mt-4 border-t border-line pt-4">
                  <label htmlFor={`reply-${m.id}`} className="mb-1.5 block text-sm font-medium text-ink">
                    Reply to {m.name} ({m.email})
                  </label>
                  <textarea
                    id={`reply-${m.id}`}
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply… It will be emailed to the sender and the message marked handled."
                    className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink shadow-sm focus:border-maroon-500 focus:outline-none focus:ring-2 focus:ring-maroon-500/20"
                  />
                  {replyNote ? <p className="mt-2 text-sm text-rose-600">{replyNote}</p> : null}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => sendReply(m.id)}
                      disabled={sending || replyText.trim().length < 2}
                      className="rounded-full bg-maroon-700 px-5 py-2 text-sm font-medium text-white hover:bg-maroon-800 disabled:opacity-50"
                    >
                      {sending ? 'Sending…' : 'Send reply'}
                    </button>
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || 'Your enquiry'))}`}
                      className="rounded-full border border-line px-5 py-2 text-sm font-medium text-ink-soft hover:bg-paper-dark/40"
                    >
                      Open in mail app
                    </a>
                    <button onClick={() => setReplyTo(null)} className="px-3 py-2 text-sm text-ink-muted hover:text-ink">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
