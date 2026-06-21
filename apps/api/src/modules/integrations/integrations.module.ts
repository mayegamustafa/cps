import {
  Body,
  Controller,
  Get,
  Global,
  Injectable,
  Module,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';

const INTEGRATIONS_KEY = 'integrations';

/**
 * Shape of the integrations config. Tokens are SECRETS — they are stored in a
 * dedicated `integrations` SiteSetting row that is NEVER returned by the public
 * `GET /api/settings`. They are only readable/writable through the admin-guarded
 * endpoints below.
 */
export type IntegrationsConfig = {
  smtp?: {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    from?: string; // "City Parents School <no-reply@…>"
  };
  social?: {
    autoSync?: boolean; // run the periodic pull
    youtube?: { apiKey?: string; channelId?: string };
    instagram?: { accessToken?: string; userId?: string };
    facebook?: { pageId?: string; accessToken?: string };
  };
};

/**
 * Single source of truth for secret third-party credentials. Backed by the
 * `integrations` SiteSetting row. Global so MailService / SocialService can
 * inject it without importing this module everywhere.
 */
@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  async get(): Promise<IntegrationsConfig> {
    const row = await this.prisma.siteSetting.findUnique({
      where: { key: INTEGRATIONS_KEY },
    });
    return (row?.value as IntegrationsConfig) ?? {};
  }

  async save(value: IntegrationsConfig): Promise<IntegrationsConfig> {
    const row = await this.prisma.siteSetting.upsert({
      where: { key: INTEGRATIONS_KEY },
      update: { value: value as object },
      create: { key: INTEGRATIONS_KEY, value: value as object },
    });
    return row.value as IntegrationsConfig;
  }
}

/** Masks a secret for display (keeps the last 4 chars). */
function mask(v?: string): string | undefined {
  if (!v) return v;
  if (v.length <= 4) return '••••';
  return `••••${v.slice(-4)}`;
}

/** Returns a copy with all secret fields masked, for safe display in the admin UI. */
function maskConfig(c: IntegrationsConfig): IntegrationsConfig {
  return {
    smtp: c.smtp
      ? { ...c.smtp, pass: mask(c.smtp.pass) }
      : undefined,
    social: c.social
      ? {
          autoSync: c.social.autoSync,
          youtube: c.social.youtube
            ? { ...c.social.youtube, apiKey: mask(c.social.youtube.apiKey) }
            : undefined,
          instagram: c.social.instagram
            ? { ...c.social.instagram, accessToken: mask(c.social.instagram.accessToken) }
            : undefined,
          facebook: c.social.facebook
            ? { ...c.social.facebook, accessToken: mask(c.social.facebook.accessToken) }
            : undefined,
        }
      : undefined,
  };
}

const MASK = /^•+/; // a value left masked by the UI means "keep existing"

/** Merges an incoming (possibly masked) config over the stored one, preserving
 *  any secret the admin did not retype. */
function mergeSecrets(stored: IntegrationsConfig, incoming: IntegrationsConfig): IntegrationsConfig {
  const keep = (next?: string, prev?: string) =>
    next && MASK.test(next) ? prev : next ?? prev;
  return {
    smtp: {
      ...stored.smtp,
      ...incoming.smtp,
      pass: keep(incoming.smtp?.pass, stored.smtp?.pass),
    },
    social: {
      autoSync: incoming.social?.autoSync ?? stored.social?.autoSync,
      youtube: {
        ...stored.social?.youtube,
        ...incoming.social?.youtube,
        apiKey: keep(incoming.social?.youtube?.apiKey, stored.social?.youtube?.apiKey),
      },
      instagram: {
        ...stored.social?.instagram,
        ...incoming.social?.instagram,
        accessToken: keep(incoming.social?.instagram?.accessToken, stored.social?.instagram?.accessToken),
      },
      facebook: {
        ...stored.social?.facebook,
        ...incoming.social?.facebook,
        accessToken: keep(incoming.social?.facebook?.accessToken, stored.social?.facebook?.accessToken),
      },
    },
  };
}

@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('integrations')
export class IntegrationsController {
  constructor(private integrations: IntegrationsService) {}

  // Returns the config with secrets masked — safe for the admin form to display.
  @Get()
  async get() {
    return maskConfig(await this.integrations.get());
  }

  // Saves config; masked secrets (unchanged in the form) keep their stored value.
  @Put()
  async update(@Body() incoming: IntegrationsConfig) {
    const stored = await this.integrations.get();
    const merged = mergeSecrets(stored, incoming);
    await this.integrations.save(merged);
    return maskConfig(merged);
  }
}

@Global()
@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
