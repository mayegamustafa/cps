'use client';

import { useState } from 'react';
import { uploadFile } from '@/components/admin/FileUpload';
import type { FormField } from '@/components/admin/FieldDesigner';

const inputCls =
  'w-full rounded-xl border border-line bg-white px-4 py-2.5 text-ink shadow-sm placeholder:text-ink-muted focus:border-maroon-500 focus:outline-none focus:ring-2 focus:ring-maroon-500/20';

/** Renders a list of admin-defined form fields into a controlled values map. */
export function PublicFieldInputs({
  fields,
  values,
  onChange,
}: {
  fields: FormField[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const [uploading, setUploading] = useState<string | null>(null);
  return (
    <>
      {fields.map((f) => (
        <div key={f.key}>
          {f.type !== 'checkbox' ? (
            <label htmlFor={f.key} className="mb-1.5 block text-sm font-medium text-ink">
              {f.label} {f.required ? <span className="text-maroon-600">*</span> : null}
            </label>
          ) : null}

          {f.type === 'textarea' ? (
            <textarea id={f.key} rows={4} required={f.required} placeholder={f.placeholder} className={inputCls} value={String(values[f.key] ?? '')} onChange={(e) => onChange(f.key, e.target.value)} />
          ) : f.type === 'select' ? (
            <select id={f.key} required={f.required} className={inputCls} value={String(values[f.key] ?? '')} onChange={(e) => onChange(f.key, e.target.value)}>
              <option value="">Select…</option>
              {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.type === 'checkbox' ? (
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" required={f.required} checked={Boolean(values[f.key])} onChange={(e) => onChange(f.key, e.target.checked ? 'Yes' : '')} />
              {f.label} {f.required ? <span className="text-maroon-600">*</span> : null}
            </label>
          ) : f.type === 'file' ? (
            <div>
              <input id={f.key} type="file" className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-maroon-700 file:px-4 file:py-2 file:text-white"
                onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  setUploading(f.key);
                  try { onChange(f.key, await uploadFile(file)); } catch { /* upload unavailable */ }
                  setUploading(null);
                }} />
              {uploading === f.key ? <p className="mt-1 text-xs text-ink-muted">Uploading…</p> : null}
              {values[f.key] ? <p className="mt-1 text-xs text-emerald-700">Uploaded ✓</p> : null}
            </div>
          ) : (
            <input id={f.key} type={f.type === 'email' ? 'email' : f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'phone' ? 'tel' : 'text'}
              required={f.required} placeholder={f.placeholder} className={inputCls} value={String(values[f.key] ?? '')} onChange={(e) => onChange(f.key, e.target.value)} />
          )}
        </div>
      ))}
    </>
  );
}
