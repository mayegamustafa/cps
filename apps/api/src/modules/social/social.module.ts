import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Logger,
  Module,
  OnModuleInit,
  OnModuleDestroy,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { randomBytes } from 'node:crypto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ModerationStatus,
  Role,
  SocialNetwork,
  SyncMode,
} from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';
import { IntegrationsService } from '../integrations/integrations.module';

/** A normalised post pulled from any network, ready to upsert. */
type FetchedPost = {
  network: SocialNetwork;
  externalId: string;
  permalink: string;
  caption?: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  isVideo: boolean;
  postedAt: Date;
};

class ModerateDto {
  @IsEnum(ModerationStatus) moderation: ModerationStatus;
}

class CreatePostDto {
  @IsEnum(SocialNetwork) network: SocialNetwork;
  @IsString() caption: string;
  @IsOptional() @IsString() permalink?: string;
  @IsOptional() @IsString() thumbnailUrl?: string;
  @IsOptional() @IsBoolean() isVideo?: boolean;
}

/**
 * Pulls the latest posts/videos from connected networks using API tokens stored
 * in the admin Integrations settings, then upserts them onto the wall. YouTube
 * (API key) and Instagram (Graph access token) are wired live; other networks
 * are pulled once their tokens/endpoints are added. Auto-synced posts are
 * published (APPROVED) so they appear on the public wall immediately.
 *
 * When `social.autoSync` is enabled in Integrations, a periodic pull runs every
 * 6 hours (and once shortly after boot).
 */
@Injectable()
export class SocialService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SocialService.name);
  private timer?: ReturnType<typeof setInterval>;
  private static readonly INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

  constructor(
    private prisma: PrismaService,
    private integrations: IntegrationsService,
  ) {}

  onModuleInit() {
    // Periodic auto-sync. The handler itself checks whether autoSync is enabled,
    // so toggling it in the admin takes effect without a restart.
    this.timer = setInterval(() => {
      void this.autoSyncIfEnabled();
    }, SocialService.INTERVAL_MS);
    // Kick off an initial pass a little after boot (don't block startup).
    setTimeout(() => void this.autoSyncIfEnabled(), 20_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async autoSyncIfEnabled() {
    try {
      const cfg = await this.integrations.get();
      if (cfg.social?.autoSync) await this.syncAll();
    } catch (e) {
      this.logger.error(`Scheduled social sync failed: ${(e as Error).message}`);
    }
  }

  /** Fetches from every configured network and upserts new posts. */
  async syncAll() {
    const cfg = (await this.integrations.get()).social ?? {};
    const fetched: FetchedPost[] = [];
    const errors: { network: string; error: string }[] = [];

    if (cfg.youtube?.apiKey && cfg.youtube?.channelId) {
      try {
        fetched.push(...(await this.fetchYouTube(cfg.youtube.apiKey, cfg.youtube.channelId)));
      } catch (e) {
        errors.push({ network: 'YOUTUBE', error: (e as Error).message });
      }
    }
    if (cfg.instagram?.accessToken) {
      try {
        fetched.push(...(await this.fetchInstagram(cfg.instagram.accessToken)));
      } catch (e) {
        errors.push({ network: 'INSTAGRAM', error: (e as Error).message });
      }
    }

    let upserts = 0;
    for (const p of fetched) {
      await this.prisma.socialPost.upsert({
        where: { network_externalId: { network: p.network, externalId: p.externalId } },
        update: {
          caption: p.caption,
          thumbnailUrl: p.thumbnailUrl,
          mediaUrl: p.mediaUrl,
          permalink: p.permalink,
        },
        create: {
          network: p.network,
          externalId: p.externalId,
          permalink: p.permalink,
          caption: p.caption,
          thumbnailUrl: p.thumbnailUrl,
          mediaUrl: p.mediaUrl,
          isVideo: p.isVideo,
          postedAt: p.postedAt,
          moderation: ModerationStatus.APPROVED,
        },
      });
      upserts++;
    }

    const configured = [
      cfg.youtube?.apiKey && cfg.youtube?.channelId ? 'YOUTUBE' : null,
      cfg.instagram?.accessToken ? 'INSTAGRAM' : null,
    ].filter(Boolean);

    return {
      configured,
      fetched: fetched.length,
      upserted: upserts,
      errors,
      note: configured.length
        ? undefined
        : 'No network tokens configured. Add them under Admin → Integrations.',
    };
  }

  /** YouTube Data API v3 — latest uploads for a channel (API key only). */
  private async fetchYouTube(apiKey: string, channelId: string): Promise<FetchedPost[]> {
    const url =
      `https://www.googleapis.com/youtube/v3/search?key=${apiKey}` +
      `&channelId=${channelId}&part=snippet&order=date&type=video&maxResults=12`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`YouTube API ${res.status}`);
    const data = (await res.json()) as {
      items?: {
        id?: { videoId?: string };
        snippet?: {
          title?: string;
          description?: string;
          publishedAt?: string;
          thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
        };
      }[];
    };
    return (data.items ?? [])
      .filter((i) => i.id?.videoId)
      .map((i) => ({
        network: SocialNetwork.YOUTUBE,
        externalId: i.id!.videoId!,
        permalink: `https://www.youtube.com/watch?v=${i.id!.videoId}`,
        caption: i.snippet?.title,
        thumbnailUrl: i.snippet?.thumbnails?.high?.url ?? i.snippet?.thumbnails?.medium?.url,
        isVideo: true,
        postedAt: i.snippet?.publishedAt ? new Date(i.snippet.publishedAt) : new Date(),
      }));
  }

  /** Instagram Graph API — recent media for the connected account. */
  private async fetchInstagram(token: string): Promise<FetchedPost[]> {
    const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp';
    const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=12&access_token=${token}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Instagram API ${res.status}`);
    const data = (await res.json()) as {
      data?: {
        id: string;
        caption?: string;
        media_type?: string;
        media_url?: string;
        permalink?: string;
        thumbnail_url?: string;
        timestamp?: string;
      }[];
    };
    return (data.data ?? []).map((m) => ({
      network: SocialNetwork.INSTAGRAM,
      externalId: m.id,
      permalink: m.permalink ?? '#',
      caption: m.caption,
      thumbnailUrl: m.thumbnail_url ?? m.media_url,
      mediaUrl: m.media_url,
      isVideo: m.media_type === 'VIDEO',
      postedAt: m.timestamp ? new Date(m.timestamp) : new Date(),
    }));
  }

  wall(network?: SocialNetwork) {
    return this.prisma.socialPost.findMany({
      where: { moderation: ModerationStatus.APPROVED, ...(network ? { network } : {}) },
      orderBy: [{ pinned: 'desc' }, { postedAt: 'desc' }],
      take: 24,
    });
  }
}

@ApiTags('social')
@Controller('social')
export class SocialController {
  constructor(
    private prisma: PrismaService,
    private social: SocialService,
  ) {}

  // Public social wall (approved posts only)
  @Get('wall')
  wall(@Query('network') network?: SocialNetwork) {
    return this.social.wall(network);
  }

  // Admin: moderation queue
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Get('queue')
  queue() {
    return this.prisma.socialPost.findMany({
      where: { moderation: ModerationStatus.PENDING },
      orderBy: { postedAt: 'desc' },
    });
  }

  // Admin: list every post.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Get('admin/list')
  adminList() {
    return this.prisma.socialPost.findMany({ orderBy: { postedAt: 'desc' } });
  }

  // Admin: add a curated post manually (auto-approved).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Post()
  create(@Body() dto: CreatePostDto) {
    return this.prisma.socialPost.create({
      data: {
        network: dto.network,
        caption: dto.caption,
        permalink: dto.permalink ?? '#',
        thumbnailUrl: dto.thumbnailUrl,
        isVideo: dto.isVideo ?? false,
        externalId: `manual_${randomBytes(6).toString('hex')}`,
        postedAt: new Date(),
        moderation: ModerationStatus.APPROVED,
      },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreatePostDto>) {
    return this.prisma.socialPost.update({
      where: { id },
      data: {
        ...(dto.caption !== undefined ? { caption: dto.caption } : {}),
        ...(dto.permalink !== undefined ? { permalink: dto.permalink } : {}),
        ...(dto.thumbnailUrl !== undefined ? { thumbnailUrl: dto.thumbnailUrl } : {}),
        ...(dto.isVideo !== undefined ? { isVideo: dto.isVideo } : {}),
        ...(dto.network !== undefined ? { network: dto.network } : {}),
      },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.socialPost.delete({ where: { id } });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Patch(':id/moderate')
  moderate(@Param('id') id: string, @Body() dto: ModerateDto) {
    return this.prisma.socialPost.update({
      where: { id },
      data: { moderation: dto.moderation },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Post('sync')
  sync() {
    return this.social.syncAll();
  }
}

// Re-exported enums kept referenced for clarity in admin tooling.
export const SOCIAL_NETWORKS = Object.values(SocialNetwork);
export const SYNC_MODES = Object.values(SyncMode);

@Module({ controllers: [SocialController], providers: [SocialService] })
export class SocialModule {}
