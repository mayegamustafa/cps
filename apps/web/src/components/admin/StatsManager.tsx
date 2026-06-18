'use client';

import { useEffect, useState } from 'react';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Stat = { id: string; label: string; value: string; order?: number };

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('cps_token') : null;
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export function StatsManager() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch(`${API}/api/stats`);
      if (res.ok) setStats(await res.json());
    } catch {
      /* offline */
    }
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  function edit(id: string, key: 'label' | 'value', val: string) {
    setStats((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: val } : s)));
  }

  async function save(s: Stat) {
    setMsg('');
    const res = await fetch(`${API}/api/stats/${s.id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ label: s.label, value: s.value, order: s.order ?? 0 }),
    }).catch(() => null);
    setMsg(res && res.ok ? `Saved "${s.label}"` : 'Save failed (sign in again)');
  }

  async function add() {
    const res = await fetch(`${API}/api/stats`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ label: 'New statistic', value: '0', order: stats.length + 1 }),
    }).catch(() => null);
    if (res && res.ok) load();
    else setMsg('Add failed (sign in again)');
  }

  async function remove(id: string) {
    const res = await fetch(`${API}/api/stats/${id}`, { method: 'DELETE', headers: authHeaders() }).catch(() => null);
    if (res && res.ok) setStats((prev) => prev.filter((s) => s.id !== id));
    else setMsg('Delete failed (sign in again)');
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-maroon-900">School Statistics</h1>
          <p className="mt-1 text-sm text-ink-soft">
            These values display on the homepage with animated counters. Changes appear within a minute.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {msg ? <span className="text-sm font-medium text-emerald-600">{msg}</span> : null}
          <Button onClick={add} icon="plus">Add statistic</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-ink-muted">Loading...</p>
      ) : (
        <div className="space-y-3">
          {stats.map((s) => (
            <div key={s.id} className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4">
              <div className="w-28"><Field label="Value" id={`v-${s.id}`} value={s.value} onChange={(e) => edit(s.id, 'value', e.target.value)} /></div>
              <div className="min-w-48 flex-1"><Field label="Label" id={`l-${s.id}`} value={s.label} onChange={(e) => edit(s.id, 'label', e.target.value)} /></div>
              <Button onClick={() => save(s)}>Save</Button>
              <button onClick={() => remove(s.id)} aria-label="Delete" className="rounded-xl p-2.5 text-ink-muted hover:bg-rose-50 hover:text-rose-600">
                <Icon name="trash" size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
