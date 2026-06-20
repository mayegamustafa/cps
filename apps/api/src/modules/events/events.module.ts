import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PublishStatus, Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';
import { uniqueSlug } from '../../common/slug';

class CreateEventDto {
  @IsOptional() @IsString() slug?: string;
  @IsString() @MinLength(3) title: string;
  @IsString() @MinLength(1) description: string;
  @IsDateString() startsAt: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() coverImage?: string;
  @IsOptional() @IsEnum(PublishStatus) status?: PublishStatus;
}

class UpdateEventDto {
  @IsOptional() @IsString() @MinLength(3) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() coverImage?: string;
  @IsOptional() @IsEnum(PublishStatus) status?: PublishStatus;
}

class RegisterDto {
  @IsString() @MinLength(2) name: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsInt() @Min(0) guests?: number;
}

const EDITORS = [Role.SUPER_ADMIN, Role.MARKETING_ADMIN, Role.CONTENT_EDITOR];

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private prisma: PrismaService) {}

  // Public: published upcoming events.
  @Get()
  upcoming() {
    return this.prisma.event.findMany({
      where: { status: PublishStatus.PUBLISHED, deletedAt: null, startsAt: { gte: new Date() } },
      orderBy: { startsAt: 'asc' },
    });
  }

  // Admin: every non-deleted event.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EDITORS)
  @Get('admin/list')
  adminList() {
    return this.prisma.event.findMany({
      where: { deletedAt: null },
      orderBy: { startsAt: 'desc' },
    });
  }

  @Post(':id/register')
  register(@Param('id') eventId: string, @Body() dto: RegisterDto) {
    return this.prisma.eventRegistration.create({ data: { eventId, ...dto } });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EDITORS)
  @Post()
  create(@Body() dto: CreateEventDto) {
    const { startsAt, endsAt, slug, title, ...rest } = dto;
    return this.prisma.event.create({
      data: {
        ...rest,
        title,
        slug: slug || uniqueSlug(title),
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EDITORS)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    const { startsAt, endsAt, ...rest } = dto;
    return this.prisma.event.update({
      where: { id },
      data: {
        ...rest,
        ...(startsAt ? { startsAt: new Date(startsAt) } : {}),
        ...(endsAt ? { endsAt: new Date(endsAt) } : {}),
      },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.event.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

@Module({ controllers: [EventsController] })
export class EventsModule {}
