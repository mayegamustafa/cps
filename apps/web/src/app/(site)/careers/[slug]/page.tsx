import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/ui/PageHero';
import { Icon } from '@/components/Icon';
import { JobApplicationForm } from '@/components/forms/JobApplicationForm';
import { serverApi } from '@/lib/api-base';
import { jobs as fallbackJobs } from '@/lib/content';

type Vacancy = {
  id?: string;
  slug: string;
  title: string;
  department: string;
  type: string;
  deadline?: string | null;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  applicationFields?: import('@/components/admin/FieldDesigner').FormField[];
};

async function getVacancy(slug: string): Promise<Vacancy | null> {
  if (process.env.NEXT_PHASE !== 'phase-production-build') {
    try {
      const res = await fetch(`${serverApi()}/api/careers/vacancies/${slug}`, {
        next: { revalidate: 30 },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const v = await res.json();
        if (v && v.slug) return v as Vacancy;
      }
    } catch {
      /* fall back */
    }
  }
  const demo = fallbackJobs.find((j) => j.slug === slug);
  return demo ? (demo as Vacancy) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getVacancy(slug);
  return {
    title: job ? `${job.title} · Careers` : 'Careers',
    description: job ? `Apply for the ${job.title} position at City Parents School.` : undefined,
  };
}

const DEFAULT_REQUIREMENTS = [
  'A relevant degree and teaching/professional qualification',
  'Proven experience in a similar role',
  'Excellent communication and interpersonal skills',
  'A genuine commitment to pupil welfare and safeguarding',
];
const DEFAULT_RESPONSIBILITIES = [
  'Plan and deliver engaging, high-quality work',
  'Assess, monitor and report on progress',
  'Contribute to the wider life of the school',
  'Uphold the school’s values and standards',
];

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getVacancy(slug);
  if (!job) notFound();

  const requirements = job.requirements?.length ? job.requirements : DEFAULT_REQUIREMENTS;
  const responsibilities = job.responsibilities?.length ? job.responsibilities : DEFAULT_RESPONSIBILITIES;
  const typeLabel = String(job.type).replace(/_/g, '-').toLowerCase();
  const closes = job.deadline
    ? `Closes ${new Date(job.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
    : 'Open until filled';

  return (
    <>
      <PageHero
        eyebrow={job.department}
        title={job.title}
        crumbs={[{ label: 'Careers', href: '/careers' }, { label: job.title }]}
      />

      <section className="py-20">
        <div className="container-page grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-4 py-1.5 text-sm capitalize text-ink-soft"><Icon name="clock" size={15} /> {typeLabel}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-4 py-1.5 text-sm text-ink-soft"><Icon name="users" size={15} /> {job.department}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-4 py-1.5 text-sm text-ink-soft"><Icon name="calendar" size={15} /> {closes}</span>
            </div>

            <div className="mt-10 space-y-10">
              <div>
                <h2 className="text-2xl">About the role</h2>
                <p className="mt-3 whitespace-pre-line text-ink-soft">
                  {job.description ??
                    `City Parents School seeks an exceptional ${job.title.toLowerCase()} to join our ${job.department} team in the heart of Kampala.`}
                </p>
              </div>
              <div>
                <h2 className="text-2xl">Key responsibilities</h2>
                <ul className="mt-4 space-y-3">
                  {responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-ink-soft">
                      <span className="mt-1 text-maroon-600"><Icon name="chevron-right" size={18} /></span> {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-2xl">Requirements</h2>
                <ul className="mt-4 space-y-3">
                  {requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-ink-soft">
                      <span className="mt-1 text-maroon-600"><Icon name="shield-check" size={18} /></span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div>
            <div className="sticky top-28">
              <h2 className="text-2xl">Apply for this role</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Submit your details and a link to your CV. We will be in touch if you are shortlisted.
              </p>
              <div className="mt-6">
                <JobApplicationForm role={job.title} vacancyId={job.id} extraFields={Array.isArray(job.applicationFields) ? job.applicationFields : []} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
