'use client';

import { Icon } from '@/components/Icon';

export type FieldType = 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'checkbox' | 'file';
export type FormField = { key: string; label: string; type: FieldType; required?: boolean; options?: string[]; placeholder?: string };

export const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Paragraph' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox (yes/no)' },
  { value: 'file', label: 'File upload' },
];

export function slugifyKey(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `field_${Date.now()}`;
}

/** Ensures every field has a stable key derived from its label. */
export function withKeys(fields: FormField[]): FormField[] {
  return fields.map((f) => ({ ...f, key: f.key || slugifyKey(f.label) }));
}

const inputCls =
  'w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink shadow-sm placeholder:text-ink-muted focus:border-maroon-500 focus:outline-none focus:ring-2 focus:ring-maroon-500/20';

/** Reusable drag-free field builder used by the form builder, careers vacancy
 *  questions and the admissions form designer. */
export function FieldDesigner({
  fields,
  onChange,
  addLabel = '+ Add field',
}: {
  fields: FormField[];
  onChange: (next: FormField[]) => void;
  addLabel?: string;
}) {
  const list = Array.isArray(fields) ? fields : [];
  const setField = (i: number, p: Partial<FormField>) => onChange(list.map((f, j) => (j === i ? { ...f, ...p } : f)));
  const remove = (i: number) => onChange(list.filter((_, j) => j !== i));
  const add = () => onChange([...list, { key: '', label: '', type: 'text', required: false }]);
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-ink">Fields</span>
        <button type="button" onClick={add} className="rounded-full border border-maroon-700/30 px-3.5 py-1.5 text-sm font-medium text-maroon-800 hover:bg-maroon-50">{addLabel}</button>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-ink-muted">No fields yet.</p>
      ) : (
        <div className="space-y-3">
          {list.map((f, i) => (
            <div key={i} className="rounded-xl border border-line p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Question / label</label>
                  <input className={inputCls} value={f.label} onChange={(e) => setField(i, { label: e.target.value })} placeholder="e.g. Why do you want to join?" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Type</label>
                  <select className={inputCls} value={f.type} onChange={(e) => setField(i, { type: e.target.value as FieldType })}>
                    {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="flex items-end gap-1 pb-1">
                  <button type="button" onClick={() => move(i, -1)} aria-label="Move up" className="rounded-lg p-2 text-ink-muted hover:bg-maroon-50">↑</button>
                  <button type="button" onClick={() => move(i, 1)} aria-label="Move down" className="rounded-lg p-2 text-ink-muted hover:bg-maroon-50">↓</button>
                  <button type="button" onClick={() => remove(i)} aria-label="Remove" className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Icon name="trash" size={16} /></button>
                </div>
              </div>
              {f.type === 'select' ? (
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Dropdown options (comma separated)</label>
                  <input className={inputCls} value={(f.options ?? []).join(', ')} onChange={(e) => setField(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="Option A, Option B" />
                </div>
              ) : null}
              <label className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" checked={!!f.required} onChange={(e) => setField(i, { required: e.target.checked })} /> Required
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
