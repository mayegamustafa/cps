import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/Icon';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl text-maroon-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-soft">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: IconName;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-maroon-50 text-maroon-700">
          <Icon name={icon} size={20} />
        </span>
        {delta ? <span className="text-xs font-semibold text-emerald-600">{delta}</span> : null}
      </div>
      <p className="mt-4 font-display text-3xl text-maroon-900">{value}</p>
      <p className="mt-1 text-sm text-ink-muted">{label}</p>
    </div>
  );
}

const statusStyles: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700',
  draft: 'bg-stone-100 text-stone-600',
  scheduled: 'bg-amber-50 text-amber-700',
  submitted: 'bg-sky-50 text-sky-700',
  under_review: 'bg-amber-50 text-amber-700',
  shortlisted: 'bg-violet-50 text-violet-700',
  accepted: 'bg-emerald-50 text-emerald-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  live: 'bg-rose-50 text-rose-700',
  ended: 'bg-stone-100 text-stone-600',
  pending: 'bg-amber-50 text-amber-700',
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/\s+/g, '_');
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[key] ?? 'bg-stone-100 text-stone-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper-dark/50">
            <tr>
              {columns.map((c) => (
                <th key={c} className="px-5 py-3.5 font-semibold text-ink-soft">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-paper-dark/30">
                {row.map((cell, j) => (
                  <td key={j} className="px-5 py-3.5 text-ink">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RowActions() {
  return (
    <div className="flex items-center gap-1 text-ink-muted">
      <button aria-label="View" className="rounded-lg p-1.5 hover:bg-maroon-50 hover:text-maroon-700"><Icon name="eye" size={17} /></button>
      <button aria-label="Edit" className="rounded-lg p-1.5 hover:bg-maroon-50 hover:text-maroon-700"><Icon name="edit" size={17} /></button>
      <button aria-label="Delete" className="rounded-lg p-1.5 hover:bg-rose-50 hover:text-rose-600"><Icon name="trash" size={17} /></button>
    </div>
  );
}
