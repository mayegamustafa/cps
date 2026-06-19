import {
  Body,
  Controller,
  Get,
  Module,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { randomBytes } from 'node:crypto';
import { Role, StreamStatus, StreamProvider } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';

class CreateStreamDto {
  @IsString() @MinLength(3) title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsOptional() @IsEnum(StreamProvider) provider?: StreamProvider;
  @IsOptional() @IsString() embedUrl?: string;
  @IsOptional() @IsString() thumbnailUrl?: string;
}

class RecordingDto {
  @IsString() recordingUrl: string;
}

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + `-${Date.now().toString(36)}`
  );
}

@ApiTags('live')
@Controller('live')
export class LiveController {
  constructor(private prisma: PrismaService) {}

  // Public: the currently-live stream (if any), for the homepage/live player
  @Get('active')
  async active() {
    const stream = await this.prisma.liveStream.findFirst({
      where: { status: StreamStatus.LIVE },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true, slug: true, title: true, description: true, status: true,
        provider: true, embedUrl: true, hlsUrl: true, thumbnailUrl: true, startedAt: true,
      },
    });
    return stream ?? null;
  }

  // Public: viewing page data by slug
  @Get(':slug')
  async bySlug(@Param('slug') slug: string) {
    const stream = await this.prisma.liveStream.findUnique({
      where: { slug },
      select: {
        id: true, slug: true, title: true, description: true, status: true,
        scheduledAt: true, hlsUrl: true, recordingUrl: true, thumbnailUrl: true,
        peakViewers: true, totalViews: true,
      },
    });
    if (!stream) throw new NotFoundException('Stream not found');
    return stream;
  }

  // Public: archive of recordings
  @Get()
  recordings() {
    return this.prisma.liveStream.findMany({
      where: { status: StreamStatus.ARCHIVED },
      orderBy: { endedAt: 'desc' },
      select: { slug: true, title: true, recordingUrl: true, thumbnailUrl: true, totalViews: true, endedAt: true },
    });
  }

  // Admin: full list for the streaming operator dashboard (all statuses)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Get('manage/list')
  manageList() {
    return this.prisma.liveStream.findMany({ orderBy: { createdAt: 'desc' } });
  }

  // Admin: create a scheduled stream (generates RTMP ingest key + public slug)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Post()
  create(@Body() dto: CreateStreamDto) {
    const ingestKey = randomBytes(20).toString('hex');
    return this.prisma.liveStream.create({
      data: {
        title: dto.title,
        description: dto.description,
        slug: slugify(dto.title),
        ingestKey,
        provider: dto.provider ?? StreamProvider.RTMP,
        embedUrl: dto.embedUrl,
        thumbnailUrl: dto.thumbnailUrl,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        status: StreamStatus.SCHEDULED,
      },
    });
  }

  // Admin: go live (called by ingest webhook or operator)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Post(':id/start')
  start(@Param('id') id: string) {
    const hlsUrl = `${process.env.HLS_DELIVERY_URL ?? ''}/${id}/index.m3u8`;
    return this.prisma.liveStream.update({
      where: { id },
      data: { status: StreamStatus.LIVE, startedAt: new Date(), hlsUrl },
    });
  }

  // Admin: end stream (recording processing handled async afterwards)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Post(':id/end')
  end(@Param('id') id: string) {
    return this.prisma.liveStream.update({
      where: { id },
      data: { status: StreamStatus.PROCESSING, endedAt: new Date() },
    });
  }

  // Admin: attach a recording and archive the stream (recording management)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Post(':id/recording')
  recording(@Param('id') id: string, @Body() dto: RecordingDto) {
    return this.prisma.liveStream.update({
      where: { id },
      data: { recordingUrl: dto.recordingUrl, status: StreamStatus.ARCHIVED },
    });
  }
}

@Module({ controllers: [LiveController] })
export class LiveModule {}
