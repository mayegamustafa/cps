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
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AlertSeverity, Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';

class CreateAnnouncementDto {
  @IsOptional() @IsString() title?: string;
  @IsString() @MinLength(2) message: string;
  @IsOptional() @IsEnum(AlertSeverity) severity?: AlertSeverity;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() link?: string;
  @IsOptional() @IsString() linkLabel?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsDateString() eventDate?: string;
  @IsOptional() @IsInt() priority?: number;
  @IsOptional() @IsBoolean() popup?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsString() audience?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) pages?: string[];
  @IsOptional() @IsString() device?: string;
  @IsOptional() @IsString() frequency?: string;
}

class UpdateAnnouncementDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() @MinLength(2) message?: string;
  @IsOptional() @IsEnum(AlertSeverity) severity?: AlertSeverity;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() link?: string;
  @IsOptional() @IsString() linkLabel?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsDateString() eventDate?: string;
  @IsOptional() @IsInt() priority?: number;
  @IsOptional() @IsBoolean() popup?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsString() audience?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) pages?: string[];
  @IsOptional() @IsString() device?: string;
  @IsOptional() @IsString() frequency?: string;
}

// Normalises date strings → Date and keeps Prisma happy with the JSON-ish DTO.
function toData<T extends Partial<CreateAnnouncementDto>>(dto: T) {
  const { eventDate, startsAt, endsAt, ...rest } = dto;
  return {
    ...rest,
    ...(eventDate !== undefined ? { eventDate: eventDate ? new Date(eventDate) : null } : {}),
    ...(startsAt !== undefined ? { startsAt: startsAt ? new Date(startsAt) : null } : {}),
    ...(endsAt !== undefined ? { endsAt: endsAt ? new Date(endsAt) : null } : {}),
  };
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
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
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
      data: { ...toData(dto), message: dto.message, isActive: dto.isActive ?? true },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGER_ROLES)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.prisma.emergencyAlert.update({ where: { id }, data: toData(dto) });
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
