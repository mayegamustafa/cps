import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';

class CreateDownloadDto {
  @IsString() @MinLength(2) title: string;
  @IsString() category: string;
  @IsString() fileUrl: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isPublic?: boolean;
}

class UpdateDownloadDto {
  @IsOptional() @IsString() @MinLength(2) title?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() fileUrl?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isPublic?: boolean;
}

const EDITORS = [Role.SUPER_ADMIN, Role.MARKETING_ADMIN, Role.CONTENT_EDITOR];

@ApiTags('downloads')
@Controller('downloads')
export class DownloadsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@Query('category') category?: string) {
    return this.prisma.download.findMany({
      where: { isPublic: true, ...(category ? { category } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin: every document (incl. non-public).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EDITORS)
  @Get('admin/list')
  adminList() {
    return this.prisma.download.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Post(':id/track')
  track(@Param('id') id: string) {
    return this.prisma.download.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EDITORS)
  @Post()
  create(@Body() dto: CreateDownloadDto) {
    return this.prisma.download.create({ data: dto });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EDITORS)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDownloadDto) {
    return this.prisma.download.update({ where: { id }, data: dto });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.download.delete({ where: { id } });
  }
}

@Module({ controllers: [DownloadsController] })
export class DownloadsModule {}
