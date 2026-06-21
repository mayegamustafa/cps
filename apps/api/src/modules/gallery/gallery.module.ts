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
import { IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PublishStatus, Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';
import { uniqueSlug } from '../../common/slug';

class CreateGalleryDto {
  @IsString() @MinLength(2) title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() coverImage?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsEnum(PublishStatus) status?: PublishStatus;
}

class UpdateGalleryDto {
  @IsOptional() @IsString() @MinLength(2) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() coverImage?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsEnum(PublishStatus) status?: PublishStatus;
}

const EDITORS = [Role.SUPER_ADMIN, Role.MARKETING_ADMIN, Role.CONTENT_EDITOR];

@ApiTags('gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private prisma: PrismaService) {}

  // Public: published albums.
  @Get()
  published() {
    return this.prisma.gallery.findMany({
      where: { status: PublishStatus.PUBLISHED, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EDITORS)
  @Get('admin/list')
  adminList() {
    return this.prisma.gallery.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Public: a single published album (with photos).
  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.prisma.gallery.findFirst({
      where: { slug, status: PublishStatus.PUBLISHED, deletedAt: null },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EDITORS)
  @Post()
  create(@Body() dto: CreateGalleryDto) {
    return this.prisma.gallery.create({
      data: { ...dto, slug: uniqueSlug(dto.title) },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EDITORS)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGalleryDto) {
    return this.prisma.gallery.update({ where: { id }, data: dto });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.gallery.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

@Module({ controllers: [GalleryController] })
export class GalleryModule {}
