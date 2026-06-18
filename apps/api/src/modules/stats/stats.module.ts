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
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';

class UpsertStatDto {
  @IsString() @MinLength(1) label: string;
  @IsString() @MinLength(1) value: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsInt() order?: number;
}

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private prisma: PrismaService) {}

  // ── Public: ordered statistics for the homepage ──
  @Get()
  list() {
    return this.prisma.schoolStat.findMany({ orderBy: { order: 'asc' } });
  }

  // ── Admin ──
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN, Role.CONTENT_EDITOR)
  @Post()
  create(@Body() dto: UpsertStatDto) {
    return this.prisma.schoolStat.create({ data: dto });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN, Role.CONTENT_EDITOR)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpsertStatDto) {
    return this.prisma.schoolStat.update({ where: { id }, data: dto });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.schoolStat.delete({ where: { id } });
  }
}

@Module({ controllers: [StatsController] })
export class StatsModule {}
