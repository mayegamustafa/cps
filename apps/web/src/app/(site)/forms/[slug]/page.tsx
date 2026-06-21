import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/ui/PageHero';
import { PublicForm, type PublicFormData } from '@/components/forms/PublicForm';
import { serverApi } from '@/lib/api-base';

async function getForm(slug: string): Promise<PublicFormData | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null;
  try {
    const res = await fetch(`${serverApi()}/api/forms/public/${slug}`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const f = await res.json();
      if (f && f.slug) return { ...f, fields: Array.isArray(f.fields) ? f.fields : [] } as PublicFormData;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const f = await getForm(slug);
  return { title: f ? f.title : 'Form' };
}

export default async function FormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await getForm(slug);
  if (!form) notFound();

  return (
    <>
      <PageHero
        eyebrow="Forms"
        title={form.title}
        intro={form.description ?? undefined}
        crumbs={[{ label: 'Forms' }, { label: form.title }]}
      />
      <section className="py-20">
        <div className="container-page max-w-2xl">
          <PublicForm form={form} />
        </div>
      </section>
    </>
  );
}
