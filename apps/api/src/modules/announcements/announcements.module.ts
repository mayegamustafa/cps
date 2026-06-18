import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AlertSeverity, Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';

class CreateAnnouncementDto {
  @IsString() @MinLength(2) message: string;
  @IsOptional() @IsEnum(AlertSeverity) severity?: AlertSeverity;
  @IsOptional() @IsString() link?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class UpdateAnnouncementDto {
  @IsOptional() @IsString() @MinLength(2) message?: string;
  @IsOptional() @IsEnum(AlertSeverity) severity?: AlertSeverity;
  @IsOptional() @IsString() link?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

const MANAGER_ROLES = [Role.SUPER_ADMIN, Role.MARKETING_ADMIN, Role.CONTENT_EDITOR];

@ApiTags('announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private prisma: PrismaService) {}

  // ── Public: currently-active announcements for the site banner ──
  @Get()
  active() {
    const now = new Date();
    return this.prisma.emergencyAlert.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Admin: full list ──
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGER_ROLES)
  @Get('all')
  all() {
    return this.prisma.emergencyAlert.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGER_ROLES)
  @Post()
  create(@Body() dto: CreateAnnouncementDto) {
    return this.prisma.emergencyAlert.create({
      data: { ...dto, isActive: dto.isActive ?? true },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGER_ROLES)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.prisma.emergencyAlert.update({ where: { id }, data: dto });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.emergencyAlert.delete({ where: { id } });
  }
}

@Module({ controllers: [AnnouncementsController] })
export class AnnouncementsModule {}
