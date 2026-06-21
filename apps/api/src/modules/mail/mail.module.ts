import {
  Body,
  Controller,
  Global,
  Injectable,
  Logger,
  Module,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@cps/database';
import * as nodemailer from 'nodemailer';
import { IntegrationsService } from '../integrations/integrations.module';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';
import { emailLayout } from './templates';

export type MailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

/**
 * Sends transactional email through SMTP. Credentials come from the admin
 * Integrations settings first, then fall back to SMTP_* environment variables.
 * When nothing is configured, calls are a safe no-op (logged) so the rest of the
 * app keeps working — the school can connect SMTP later from the admin panel.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private integrations: IntegrationsService) {}

  private async resolveConfig() {
    const cfg = (await this.integrations.get()).smtp ?? {};
    const host = cfg.host || process.env.SMTP_HOST;
    const port = cfg.port || Number(process.env.SMTP_PORT ?? 587);
    const user = cfg.user || process.env.SMTP_USER;
    const pass = cfg.pass || process.env.SMTP_PASS;
    const from =
      cfg.from || process.env.SMTP_FROM || (user ? `City Parents School <${user}>` : undefined);
    const secure = cfg.secure ?? (port === 465);
    return { host, port, user, pass, from, secure };
  }

  /** True when SMTP is configured enough to attempt delivery. */
  async isConfigured(): Promise<boolean> {
    const { host, user, pass } = await this.resolveConfig();
    return Boolean(host && user && pass);
  }

  private transporter(host: string, port: number, secure: boolean, user: string, pass: string) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      // Fail fast so a misconfigured/unreachable server can never block a request.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }

  /** Verifies the connection/credentials without sending a message. */
  async verify(): Promise<{ ok: boolean; error?: string }> {
    const { host, port, secure, user, pass } = await this.resolveConfig();
    if (!host || !user || !pass) return { ok: false, error: 'SMTP not configured' };
    try {
      await this.transporter(host, port, secure, user, pass).verify();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  /** Sends an email; returns {sent:false} (logged) when SMTP is not configured. */
  async send(input: MailInput): Promise<{ sent: boolean; error?: string }> {
    const { host, port, secure, user, pass, from } = await this.resolveConfig();
    if (!host || !user || !pass || !from) {
      this.logger.warn(`Email not sent (SMTP not configured): "${input.subject}" → ${input.to}`);
      return { sent: false, error: 'SMTP not configured' };
    }
    try {
      await this.transporter(host, port, secure, user, pass).sendMail({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text ?? input.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        html: input.html,
        replyTo: input.replyTo,
      });
      return { sent: true };
    } catch (e) {
      this.logger.error(`Email send failed: ${(e as Error).message}`);
      return { sent: false, error: (e as Error).message };
    }
  }
}

@ApiTags('mail')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('mail')
export class MailController {
  constructor(private mail: MailService) {}

  // Sends a test message to the signed-in admin (or a supplied address) to
  // confirm SMTP settings work.
  @Post('test')
  async test(@Body() body: { to?: string }, @Req() req: { user?: { email?: string } }) {
    const to = body?.to || req.user?.email;
    if (!to) return { sent: false, error: 'No recipient address' };
    return this.mail.send({
      to,
      subject: 'City Parents School — SMTP test',
      html: emailLayout({
        heading: 'SMTP is working',
        body: '<p>This is a test email confirming your mail settings are configured correctly.</p>',
      }),
    });
  }
}

@Global()
@Module({ controllers: [MailController], providers: [MailService], exports: [MailService] })
export class MailModule {}
