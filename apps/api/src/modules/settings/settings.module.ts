import { Body, Controller, Get, Module, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';

const SITE_KEY = 'site';

/**
 * Stores the whole admin-editable site configuration (brand, identity, hero,
 * contact, social) as a single JSON `SiteSetting` row keyed "site". The web app
 * deep-merges it over its built-in defaults, so partial saves are safe.
 */
@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private prisma: PrismaService) {}

  // ── Public: read the live site configuration ──
  @Get()
  async get() {
    const row = await this.prisma.siteSetting.findUnique({ where: { key: SITE_KEY } });
    return row?.value ?? {};
  }

  // ── Admin: save the site configuration ──
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Put()
  async update(@Body() value: Record<string, unknown>) {
    const row = await this.prisma.siteSetting.upsert({
      where: { key: SITE_KEY },
      update: { value: value as object },
      create: { key: SITE_KEY, value: value as object },
    });
    return row.value;
  }
}

@Module({ controllers: [SettingsController] })
export class SettingsModule {}
