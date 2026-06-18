import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/ui/PageHero';
import { Icon } from '@/components/Icon';
import { JobApplicationForm } from '@/components/forms/JobApplicationForm';
import { jobs } from '@/lib/content';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = jobs.find((j) => j.slug === slug);
  return {
    title: job ? `${job.title}, Careers` : 'Careers',
    description: job ? `Apply for the ${job.title} position at City Parents School.` : undefined,
  };
}

const requirements = [
  'A relevant degree and teaching/professional qualification',
  'Proven experience in a similar role',
  'Excellent communication and interpersonal skills',
  'A genuine commitment to pupil welfare and safeguarding',
];

const responsibilities = [
  'Plan and deliver engaging, high-quality lessons',
  'Assess, monitor and report on pupil progress',
  'Contribute to the wider life of the school',
  'Uphold the school’s values and standards',
];

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = jobs.find((j) => j.slug === slug);
  if (!job) notFound();

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
              {[
                { icon: 'clock', label: job.type },
                { icon: 'users', label: job.department },
                { icon: 'calendar', label: `Closes ${new Date(job.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` },
              ].map((t) => (
                <span key={t.label} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-4 py-1.5 text-sm text-ink-soft">
                  <Icon name={t.icon as 'clock'} size={15} /> {t.label}
                </span>
              ))}
            </div>

            <div className="mt-10 space-y-10">
              <div>
                <h2 className="text-2xl">About the role</h2>
                <p className="mt-3 text-ink-soft">
                  City Parents School seeks an exceptional {job.title.toLowerCase()} to join our
                  {' '}{job.department} team. This is an opportunity to make a lasting impact in a
                  high-performing, values-driven school in the heart of Kampala.
                </p>
              </div>
              <div>
                <h2 className="text-2xl">Key responsibilities</h2>
                <ul className="mt-4 space-y-3">
                  {responsibilities.map((r) => (
                    <li key={r} className="flex items-start gap-3 text-ink-soft">
                      <span className="mt-1 text-maroon-600"><Icon name="chevron-right" size={18} /></span> {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-2xl">Requirements</h2>
                <ul className="mt-4 space-y-3">
                  {requirements.map((r) => (
                    <li key={r} className="flex items-start gap-3 text-ink-soft">
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
                Upload your CV and supporting documents. You will receive a confirmation once submitted.
              </p>
              <div className="mt-6">
                <JobApplicationForm role={job.title} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
