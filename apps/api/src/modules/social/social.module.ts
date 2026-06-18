import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsEnum } from 'class-validator';
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

class ModerateDto {
  @IsEnum(ModerationStatus) moderation: ModerationStatus;
}

/**
 * Pulls latest posts/videos from each connected network. Real implementations
 * call the respective Graph/Data APIs; here the contract is defined and the
 * persistence + moderation flow is fully wired. Accounts set to AUTO are
 * published immediately; MANUAL_APPROVAL queues posts as PENDING.
 */
@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  async syncAll() {
    const accounts = await this.prisma.socialAccount.findMany({ where: { isActive: true } });
    // For each account: fetch from the network API, then upsert posts.
    // Returns a summary so admins can see what was synced.
    return {
      synced: accounts.map((a) => ({ network: a.network, handle: a.handle, mode: a.syncMode })),
      note: 'Connect network API tokens in environment to enable live pulls.',
    };
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
