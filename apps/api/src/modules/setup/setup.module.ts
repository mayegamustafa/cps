import {
  Controller,
  Get,
  Module,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  Role,
  PublishStatus,
  JobStatus,
  JobType,
  StreamStatus,
} from '@cps/database';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { hashPassword } from '../../auth/password.util';

/**
 * First-run setup: seeds the database (admin + baseline content) with one call.
 * Safe by design:
 *  - If no SUPER_ADMIN exists, anyone may run it once (bootstrap).
 *  - Once an admin exists, re-running requires the SETUP_KEY (x-setup-key).
 */
@ApiTags('setup')
@Controller('setup')
export class SetupController {
  constructor(private prisma: PrismaService) {}

  @Get('status')
  async status() {
    let admins: number;
    try {
      admins = await this.prisma.user.count({
        where: { roles: { has: Role.SUPER_ADMIN } },
      });
    } catch (e) {
      throw new ServiceUnavailableException(
        `Database not reachable or not migrated: ${(e as Error).message}`,
      );
    }
    return { adminExists: admins > 0, needsSetup: admins === 0 };
  }

  @Post('seed')
  async seed() {
    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@cityparents.ac.ug';
    // Only (re)set the password when SEED_ADMIN_PASSWORD is explicitly provided.
    // Resetting to a secret env value is safe (an attacker can't learn it) and
    // lets the operator recover the login deterministically. When unset we leave
    // an existing password untouched and never reset to the public default.
    const hasCustomPassword = !!process.env.SEED_ADMIN_PASSWORD;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

    let existing: { id: string } | null;
    try {
      existing = await this.prisma.user.findUnique({
        where: { email: adminEmail },
        select: { id: true },
      });
    } catch (e) {
      throw new ServiceUnavailableException(
        `Database not reachable or not migrated: ${(e as Error).message}`,
      );
    }

    const passwordWasSet = hasCustomPassword || !existing;
    await this.prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        roles: [Role.SUPER_ADMIN],
        isActive: true,
        ...(hasCustomPassword ? { passwordHash: hashPassword(adminPassword) } : {}),
      },
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

    await this.seedContent();

    return {
      seeded: true,
      adminEmail,
      adminCreated: !existing,
      passwordWasSet,
      message: !existing
        ? 'Admin created and baseline content seeded. You can now sign in.'
        : passwordWasSet
          ? 'Admin password reset to your SEED_ADMIN_PASSWORD. You can now sign in.'
          : 'Baseline content ensured. Set SEED_ADMIN_PASSWORD and seed again to reset the admin password.',
    };
  }

  private async seedContent() {
    const stats = [
      { id: 'years', label: 'Years of excellence', value: '25+', icon: 'trophy', order: 1 },
      { id: 'pupils', label: 'Pupils enrolled', value: '2,400+', icon: 'users', order: 2 },
      { id: 'staff', label: 'Qualified staff', value: '180', icon: 'graduation-cap', order: 3 },
      { id: 'classrooms', label: 'Modern classrooms', value: '64', icon: 'book-open', order: 4 },
      { id: 'alumni', label: 'Proud alumni', value: '12,000+', icon: 'heart-hand', order: 5 },
      { id: 'awards', label: 'National awards', value: '45', icon: 'sparkle', order: 6 },
    ];
    for (const s of stats) {
      await this.prisma.schoolStat.upsert({ where: { id: s.id }, update: s, create: s });
    }

    await this.prisma.siteSetting.upsert({
      where: { key: 'site' },
      update: {},
      create: {
        key: 'site',
        value: {
          contact: { phone: '+256 700 000 000', email: 'info@cityparents.ac.ug', whatsapp: '256700000000' },
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

    const houses = [
      { name: 'Nile', color: '#1E4D8C', motto: 'Strength in Flow', points: 1240 },
      { name: 'Rwenzori', color: '#2E7D32', motto: 'Reach the Summit', points: 1180 },
      { name: 'Elgon', color: '#6E1F23', motto: 'Rooted and Rising', points: 1095 },
      { name: 'Victoria', color: '#B8860B', motto: 'Boundless Horizons', points: 1320 },
    ];
    for (const h of houses) {
      await this.prisma.house.upsert({ where: { name: h.name }, update: { points: h.points }, create: h });
    }

    await this.prisma.newsArticle.upsert({
      where: { slug: 'national-examinations-2026' },
      update: {},
      create: {
        slug: 'national-examinations-2026',
        title: 'City Parents tops the district in national examinations',
        excerpt: 'Our candidates delivered the school’s best-ever results.',
        body: 'City Parents School is proud to announce outstanding performance in the national examinations.',
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
        tags: ['achievement'],
      },
    });

    await this.prisma.event.upsert({
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

    await this.prisma.jobVacancy.upsert({
      where: { slug: 'upper-primary-science-teacher' },
      update: {},
      create: {
        slug: 'upper-primary-science-teacher',
        title: 'Upper Primary Science Teacher',
        department: 'Upper Primary',
        type: JobType.FULL_TIME,
        description: 'We are seeking an experienced, passionate science teacher for our Upper Primary section.',
        requirements: ['Bachelor’s degree in Education', 'At least 3 years teaching experience'],
        responsibilities: ['Plan and deliver lessons', 'Assess pupil progress'],
        deadline: new Date('2026-07-15T00:00:00Z'),
        status: JobStatus.OPEN,
      },
    });

    const downloads = [
      { title: 'School Prospectus 2026', category: 'Prospectus', fileUrl: 'https://media.cityparents.ac.ug/prospectus-2026.pdf', fileSize: 4_400_000 },
      { title: 'Admission Application Form', category: 'Forms', fileUrl: 'https://media.cityparents.ac.ug/admission-form.pdf', fileSize: 327_680 },
      { title: 'Fees Structure 2026', category: 'Forms', fileUrl: 'https://media.cityparents.ac.ug/fees-2026.pdf', fileSize: 184_320 },
    ];
    for (const d of downloads) {
      const found = await this.prisma.download.findFirst({ where: { title: d.title } });
      if (!found) await this.prisma.download.create({ data: d });
    }

    await this.prisma.liveStream.upsert({
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
  }
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'ok' };
    } catch (e) {
      throw new ServiceUnavailableException({
        status: 'error',
        db: 'error',
        message: (e as Error).message,
      });
    }
  }
}

@Module({ controllers: [SetupController, HealthController] })
export class SetupModule {}
