'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { uploadFile } from '@/components/admin/FileUpload';

type FieldType = 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'checkbox' | 'file';
export type PublicFormField = { key: string; label: string; type: FieldType; required?: boolean; options?: string[]; placeholder?: string };
export type PublicFormData = {
  slug: string;
  title: string;
  description?: string | null;
  fields: PublicFormField[];
  submitLabel?: string | null;
  successMessage?: string | null;
};

const inputCls =
  'w-full rounded-xl border border-line bg-white px-4 py-2.5 text-ink shadow-sm placeholder:text-ink-muted focus:border-maroon-500 focus:outline-none focus:ring-2 focus:ring-maroon-500/20';

export function PublicForm({ form }: { form: PublicFormData }) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);

  function set(key: string, v: unknown) { setValues((p) => ({ ...p, [key]: v })); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending'); setError('');
    try {
      const res = await fetch(`/api/forms/public/${form.slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: values }),
      });
      if (res.ok) setStatus('done');
      else { setStatus('error'); setError('Could not submit. Please try again.'); }
    } catch {
      setStatus('error'); setError('Could not reach the server. Please try again.');
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white"><Icon name="shield-check" size={26} /></span>
        <p className="mt-4 text-lg font-medium text-emerald-900">{form.successMessage || 'Thank you — your response has been received.'}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {form.fields.map((f) => (
        <div key={f.key}>
          {f.type !== 'checkbox' ? (
            <label htmlFor={f.key} className="mb-1.5 block text-sm font-medium text-ink">
              {f.label} {f.required ? <span className="text-maroon-600">*</span> : null}
            </label>
          ) : null}

          {f.type === 'textarea' ? (
            <textarea id={f.key} rows={4} required={f.required} placeholder={f.placeholder} className={inputCls} value={String(values[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)} />
          ) : f.type === 'select' ? (
            <select id={f.key} required={f.required} className={inputCls} value={String(values[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)}>
              <option value="">Select…</option>
              {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.type === 'checkbox' ? (
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" required={f.required} checked={Boolean(values[f.key])} onChange={(e) => set(f.key, e.target.checked ? 'Yes' : '')} />
              {f.label} {f.required ? <span className="text-maroon-600">*</span> : null}
            </label>
          ) : f.type === 'file' ? (
            <div>
              <input id={f.key} type="file" className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-maroon-700 file:px-4 file:py-2 file:text-white"
                onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  setUploading(f.key); setError('');
                  try { set(f.key, await uploadFile(file)); } catch { setError('File upload is not available right now.'); }
                  setUploading(null);
                }} />
              {uploading === f.key ? <p className="mt-1 text-xs text-ink-muted">Uploading…</p> : null}
              {values[f.key] ? <p className="mt-1 text-xs text-emerald-700">Uploaded ✓</p> : null}
            </div>
          ) : (
            <input id={f.key} type={f.type === 'email' ? 'email' : f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'phone' ? 'tel' : 'text'}
              required={f.required} placeholder={f.placeholder} className={inputCls} value={String(values[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)} />
          )}
        </div>
      ))}

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Submitting…' : (form.submitLabel || 'Submit')}</Button>
    </form>
  );
}
