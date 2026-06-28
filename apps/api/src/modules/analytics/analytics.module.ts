import {
  Body,
  Controller,
  Get,
  HttpCode,
  Injectable,
  Module,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';
import { parseDevice, parseBrowser, parseOs, classifySource } from '../../common/ua';

class TrackDto {
  @IsString() @MaxLength(512) path: string;
  @IsOptional() @IsString() @MaxLength(1024) referrer?: string;
  @IsString() @MaxLength(64) visitorId: string;
  @IsString() @MaxLength(64) sessionId: string;
  @IsOptional() @IsBoolean() isNew?: boolean;
}

type Row = {
  path: string;
  source: string;
  device: string;
  browser: string;
  os: string;
  country: string | null;
  visitorId: string;
  sessionId: string;
  isNewVisitor: boolean;
  createdAt: Date;
};

function tally<T extends string>(rows: Row[], key: (r: Row) => T | null): { label: string; count: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async summary(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = (await this.prisma.pageView.findMany({
      where: { createdAt: { gte: since } },
      select: {
        path: true, source: true, device: true, browser: true, os: true,
        country: true, visitorId: true, sessionId: true, isNewVisitor: true, createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 100_000,
    })) as Row[];

    const visitors = new Set(rows.map((r) => r.visitorId));
    const newVisitors = new Set(rows.filter((r) => r.isNewVisitor).map((r) => r.visitorId));

    // Session stats for bounce rate & average duration.
    const sessions = new Map<string, { count: number; first: number; last: number }>();
    for (const r of rows) {
      const t = r.createdAt.getTime();
      const s = sessions.get(r.sessionId);
      if (s) { s.count++; s.first = Math.min(s.first, t); s.last = Math.max(s.last, t); }
      else sessions.set(r.sessionId, { count: 1, first: t, last: t });
    }
    const sessionList = [...sessions.values()];
    const bounced = sessionList.filter((s) => s.count === 1).length;
    const durations = sessionList.filter((s) => s.count > 1).map((s) => s.last - s.first);
    const avgSessionMinutes = durations.length
      ? +(durations.reduce((a, b) => a + b, 0) / durations.length / 60000).toFixed(1)
      : 0;

    // Daily series.
    const dayMap = new Map<string, { views: number; visitors: Set<string> }>();
    for (const r of rows) {
      const d = r.createdAt.toISOString().slice(0, 10);
      const e = dayMap.get(d) ?? { views: 0, visitors: new Set<string>() };
      e.views++; e.visitors.add(r.visitorId);
      dayMap.set(d, e);
    }
    const series: { date: string; views: number; visitors: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const e = dayMap.get(d);
      series.push({ date: d, views: e?.views ?? 0, visitors: e ? e.visitors.size : 0 });
    }

    return {
      range: { days, since: since.toISOString() },
      totals: {
        views: rows.length,
        visitors: visitors.size,
        sessions: sessions.size,
        newVisitors: newVisitors.size,
        returningVisitors: Math.max(0, visitors.size - newVisitors.size),
        avgSessionMinutes,
        bounceRate: sessions.size ? Math.round((bounced / sessions.size) * 100) : 0,
      },
      series,
      topPages: tally(rows, (r) => r.path).slice(0, 12),
      devices: tally(rows, (r) => r.device),
      browsers: tally(rows, (r) => r.browser),
      os: tally(rows, (r) => r.os),
      sources: tally(rows, (r) => r.source),
      countries: tally(rows, (r) => r.country).slice(0, 12),
    };
  }
}

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private prisma: PrismaService,
    private analytics: AnalyticsService,
  ) {}

  // Public ingestion endpoint (called by the first-party beacon).
  @Post('track')
  @HttpCode(204)
  async track(@Body() dto: TrackDto, @Req() req: { headers: Record<string, string | string[] | undefined> }) {
    const ua = (req.headers['user-agent'] as string) ?? '';
    const countryHeader = (req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || req.headers['x-country']) as string | undefined;
    let selfHost: string | undefined;
    try { selfHost = dto.referrer ? new URL(dto.referrer).hostname : undefined; } catch { /* ignore */ }
    void selfHost;
    await this.prisma.pageView.create({
      data: {
        path: dto.path.slice(0, 512),
        referrer: dto.referrer?.slice(0, 1024) || null,
        source: classifySource(dto.referrer, process.env.PUBLIC_HOST),
        device: parseDevice(ua),
        browser: parseBrowser(ua),
        os: parseOs(ua),
        country: countryHeader && countryHeader !== 'XX' ? countryHeader : null,
        visitorId: dto.visitorId.slice(0, 64),
        sessionId: dto.sessionId.slice(0, 64),
        isNewVisitor: dto.isNew ?? true,
      },
    });
  }

  // Admin: aggregated dashboard data.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Get('summary')
  summary(@Query('days') days?: string) {
    const n = Math.min(Math.max(Number(days) || 30, 1), 365);
    return this.analytics.summary(n);
  }
}

@Module({ controllers: [AnalyticsController], providers: [AnalyticsService] })
export class AnalyticsModule {}
