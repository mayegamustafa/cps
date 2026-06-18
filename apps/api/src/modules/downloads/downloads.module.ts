import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Post,
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

  @Post(':id/track')
  track(@Param('id') id: string) {
    return this.prisma.download.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN, Role.CONTENT_EDITOR)
  @Post()
  create(@Body() dto: CreateDownloadDto) {
    return this.prisma.download.create({ data: dto });
  }
}

@Module({ controllers: [DownloadsController] })
export class DownloadsModule {}
