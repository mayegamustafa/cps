import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { Role } from '@cps/database';
import { NewsService } from './news.service';
import { CreateNewsDto, UpdateNewsDto } from './news.dto';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private news: NewsService) {}

  // ── Public ──
  @Get()
  list(@Query('take') take?: string, @Query('skip') skip?: string) {
    return this.news.findPublished(Number(take) || 12, Number(skip) || 0);
  }

  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.news.findBySlug(slug);
  }

  // ── Admin (RBAC) ──
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN, Role.CONTENT_EDITOR)
  @Post()
  create(@Body() dto: CreateNewsDto, @Req() req: Request) {
    return this.news.create(dto, (req.user as { id: string }).id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN, Role.CONTENT_EDITOR)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNewsDto) {
    return this.news.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.news.remove(id);
  }
}
