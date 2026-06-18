import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

const labelCls = 'block text-sm font-medium text-ink mb-1.5';
const controlCls =
  'w-full rounded-xl border border-line bg-white px-4 py-2.5 text-ink shadow-sm transition-colors placeholder:text-ink-muted focus:border-maroon-500 focus:outline-none focus:ring-2 focus:ring-maroon-500/20';

export function Field({
  label,
  id,
  hint,
  required,
  ...props
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label} {required ? <span className="text-maroon-600">*</span> : null}
      </label>
      <input id={id} required={required} className={controlCls} {...props} />
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function TextAreaField({
  label,
  id,
  required,
  ...props
}: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label} {required ? <span className="text-maroon-600">*</span> : null}
      </label>
      <textarea id={id} required={required} className={controlCls} rows={5} {...props} />
    </div>
  );
}

export function SelectField({
  label,
  id,
  required,
  children,
  ...props
}: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label} {required ? <span className="text-maroon-600">*</span> : null}
      </label>
      <select id={id} required={required} className={controlCls} {...props}>
        {children}
      </select>
    </div>
  );
}
