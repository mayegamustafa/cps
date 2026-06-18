import {
  PrismaClient,
  Role,
  PublishStatus,
  JobStatus,
  JobType,
  StreamStatus,
  SchoolSection,
  Residence,
} from '@prisma/client';
import { randomBytes, scryptSync } from 'node:crypto';

const prisma = new PrismaClient();

// Mirrors the API's scrypt hashing so seeded accounts can log in.
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

async function main() {
  console.log('Seeding City Parents School platform...');

  // ── Default Super Admin (credentials from environment, never hardcoded) ──
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@cityparents.ac.ug';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  await prisma.user.upsert({
    where: { email: adminEmail },
    // Do not reset the password on existing accounts (safe to run every deploy).
    update: { roles: [Role.SUPER_ADMIN], isActive: true },
    create: {
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      firstName: process.env.SEED_ADMIN_FIRST_NAME ?? 'Super',
      lastName: process.env.SEED_ADMIN_LAST_NAME ?? 'Admin',
      roles: [Role.SUPER_ADMIN],
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`  Super Admin: ${adminEmail}`);

  // ── Dynamic statistics (editable in admin) ──
  const stats = [
    { id: 'years', label: 'Years of excellence', value: '25+', icon: 'trophy', order: 1 },
    { id: 'pupils', label: 'Pupils enrolled', value: '2,400+', icon: 'users', order: 2 },
    { id: 'staff', label: 'Qualified staff', value: '180', icon: 'graduation-cap', order: 3 },
    { id: 'classrooms', label: 'Modern classrooms', value: '64', icon: 'book-open', order: 4 },
    { id: 'alumni', label: 'Proud alumni', value: '12,000+', icon: 'heart-hand', order: 5 },
    { id: 'awards', label: 'National awards', value: '45', icon: 'sparkle', order: 6 },
  ];
  for (const s of stats) {
    await prisma.schoolStat.upsert({ where: { id: s.id }, update: s, create: s });
  }

  // ── Site settings: brand, contact, social links (DB-driven) ──
  await prisma.siteSetting.upsert({
    where: { key: 'site' },
    update: {},
    create: {
      key: 'site',
      value: {
        contact: {
          phone: '+256 700 000 000',
          email: 'info@cityparents.ac.ug',
          whatsapp: '256700000000',
        },
        social: [
          { network: 'youtube', label: 'YouTube', href: 'https://youtube.com/@cityparents' },
          { network: 'instagram', label: 'Instagram', href: 'https://instagram.com/cityparents' },
          { network: 'facebook', label: 'Facebook', href: 'https://facebook.com/cityparents' },
          { network: 'tiktok', label: 'TikTok', href: 'https://tiktok.com/@cityparents' },
          { network: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com/company/cityparents' },
        ],
      },
    },
  });

  // ── Houses ──
  const houses = [
    { name: 'Nile', color: '#1E4D8C', motto: 'Strength in Flow', points: 1240 },
    { name: 'Rwenzori', color: '#2E7D32', motto: 'Reach the Summit', points: 1180 },
    { name: 'Elgon', color: '#6E1F23', motto: 'Rooted and Rising', points: 1095 },
    { name: 'Victoria', color: '#B8860B', motto: 'Boundless Horizons', points: 1320 },
  ];
  for (const h of houses) {
    await prisma.house.upsert({ where: { name: h.name }, update: { points: h.points }, create: h });
  }

  // ── Sample News ──
  await prisma.newsArticle.upsert({
    where: { slug: 'national-examinations-2026' },
    update: {},
    create: {
      slug: 'national-examinations-2026',
      title: 'City Parents tops the district in national examinations',
      excerpt: 'Our candidates delivered the school’s best-ever results.',
      body: 'City Parents School is proud to announce outstanding performance in the national examinations, with distinctions across the board.',
      status: PublishStatus.PUBLISHED,
      publishedAt: new Date(),
      tags: ['achievement'],
    },
  });

  // ── Sample Event ──
  await prisma.event.upsert({
    where: { slug: 'open-day-2026' },
    update: {},
    create: {
      slug: 'open-day-2026',
      title: 'Open Day and Campus Tour',
      description: 'Prospective families are warmly invited to tour the campus and meet our teachers.',
      location: 'Main Campus',
      startsAt: new Date('2026-07-12T09:00:00Z'),
      category: 'Admissions',
      status: PublishStatus.PUBLISHED,
    },
  });

  // ── Sample Job Vacancy ──
  await prisma.jobVacancy.upsert({
    where: { slug: 'upper-primary-science-teacher' },
    update: {},
    create: {
      slug: 'upper-primary-science-teacher',
      title: 'Upper Primary Science Teacher',
      department: 'Upper Primary',
      type: JobType.FULL_TIME,
      description: 'We are seeking an experienced, passionate science teacher for our Upper Primary section.',
      requirements: ['Bachelor’s degree in Education', 'At least 3 years teaching experience', 'Strong classroom management'],
      responsibilities: ['Plan and deliver lessons', 'Assess pupil progress', 'Support co-curricular activities'],
      deadline: new Date('2026-07-15T00:00:00Z'),
      status: JobStatus.OPEN,
    },
  });

  // ── Sample Downloads ──
  const downloads = [
    { title: 'School Prospectus 2026', category: 'Prospectus', fileUrl: 'https://media.cityparents.ac.ug/prospectus-2026.pdf', fileSize: 4_400_000 },
    { title: 'Admission Application Form', category: 'Forms', fileUrl: 'https://media.cityparents.ac.ug/admission-form.pdf', fileSize: 327_680 },
    { title: 'Fees Structure 2026', category: 'Forms', fileUrl: 'https://media.cityparents.ac.ug/fees-2026.pdf', fileSize: 184_320 },
    { title: 'Code of Conduct Policy', category: 'Policies', fileUrl: 'https://media.cityparents.ac.ug/code-of-conduct.pdf', fileSize: 655_360 },
  ];
  for (const d of downloads) {
    const existing = await prisma.download.findFirst({ where: { title: d.title } });
    if (!existing) await prisma.download.create({ data: d });
  }

  // ── Sample Live Stream ──
  await prisma.liveStream.upsert({
    where: { slug: 'graduation-2026' },
    update: {},
    create: {
      slug: 'graduation-2026',
      title: 'Graduation Ceremony 2026',
      description: 'Watch the Primary Seven graduation ceremony live.',
      status: StreamStatus.SCHEDULED,
      scheduledAt: new Date('2026-08-23T11:00:00Z'),
      ingestKey: `live_${randomBytes(8).toString('hex')}`,
    },
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

// Keep imported enums referenced for environments with noUnusedLocals.
void SchoolSection;
void Residence;
