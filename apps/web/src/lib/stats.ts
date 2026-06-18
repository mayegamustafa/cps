export type SchoolStat = {
  id: string;
  label: string;
  value: string;
  icon?: string | null;
  order?: number;
};

const FALLBACK: SchoolStat[] = [
  { id: 'years', label: 'Years of excellence', value: '25+' },
  { id: 'pupils', label: 'Pupils enrolled', value: '2,400+' },
  { id: 'staff', label: 'Qualified staff', value: '180' },
  { id: 'awards', label: 'National awards', value: '45' },
];

/** Live, admin-editable statistics with offline fallback. */
export async function getStats(): Promise<SchoolStat[]> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return FALLBACK;
  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${API}/api/stats`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return FALLBACK;
    const rows = (await res.json()) as SchoolStat[];
    return Array.isArray(rows) && rows.length ? rows : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
