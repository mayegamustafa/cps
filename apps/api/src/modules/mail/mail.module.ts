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
  cc?: string[];
  /** Overrides the configured From, so a reply leaves as the mailbox it was sent to. */
  from?: string;
  /** Our own Message-ID, so an inbound reply can be matched back to the thread. */
  messageId?: string;
  /** In-Reply-To / References, so mail clients thread the reply correctly. */
  headers?: Record<string, string>;
  /** Files streamed from their storage URL at send time, never buffered here. */
  attachments?: { filename: string; path: string; contentType?: string }[];
};

/**
 * Sends transactional email through SMTP. Credentials come from the admin
 * Integrations settings first, then fall back to SMTP_* environment variables.
 * When nothing is configured, calls are a safe no-op (logged) so the rest of the
 * app keeps working — the school can connect SMTP later from the admin panel.
 **/

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
    const apiKey = cfg.apiKey || process.env.BREVO_API_KEY;
    const from =
      cfg.from || process.env.SMTP_FROM || (user ? `City Parents School <${user}>` : undefined);
    const secure = cfg.secure ?? (port === 465);
    return { host, port, user, pass, from, secure, apiKey };
  }

  /** True when there is enough configuration to attempt delivery either way. */
  async isConfigured(): Promise<boolean> {
    const { host, user, pass, apiKey, from } = await this.resolveConfig();
    if (apiKey && from) return true;
    return Boolean(host && user && pass);
  }


  /**
   * Sends over Brevo's HTTPS API instead of SMTP.
   *
   * Hosting platforms routinely block outbound 587 and 465 to stop their
   * machines being used as spam relays, and the symptom is a connection
   * timeout that looks exactly like a wrong password. Port 443 is never
   * blocked, so this path works where SMTP silently does not.
   */
  private async sendViaApi(
    apiKey: string,
    from: string,
    input: MailInput,
  ): Promise<{ sent: boolean; error?: string }> {
    const sender = parseAddress(from);
    if (!sender) return { sent: false, error: 'The From address is not a valid email address.' };

    const headers: Record<string, string> = { ...(input.headers ?? {}) };
    // Our own Message-ID matters for threading. Brevo may replace it, in which
    // case an inbound reply still lands on the right conversation through the
    // subject-and-sender fallback.
    if (input.messageId) headers['Message-Id'] = input.messageId;

    const payload = {
      sender,
      to: splitAddresses(input.to),
      cc: input.cc?.length ? splitAddresses(input.cc.join(',')) : undefined,
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text,
      replyTo: input.replyTo ? { email: input.replyTo } : undefined,
      headers: Object.keys(headers).length ? headers : undefined,
      // Brevo fetches each file itself, so nothing is buffered here.
      attachment: input.attachments?.length
        ? input.attachments.map((a) => ({ url: a.path, name: a.filename }))
        : undefined,
    };

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20_000),
      });
      if (res.ok) return { sent: true };

      const body = await res.text().catch(() => '');
      if (res.status === 401) {
        return { sent: false, error: 'Brevo rejected the API key. Check it, and that IP restriction is off.' };
      }
      return { sent: false, error: `Brevo ${res.status}: ${body.slice(0, 300)}` };
    } catch (e) {
      return { sent: false, error: `Could not reach Brevo: ${(e as Error).message}` };
    }
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
    const { host, port, secure, user, pass, apiKey } = await this.resolveConfig();
    if (apiKey) {
      try {
        const res = await fetch('https://api.brevo.com/v3/account', {
          headers: { 'api-key': apiKey, accept: 'application/json' },
          signal: AbortSignal.timeout(15_000),
        });
        return res.ok ? { ok: true } : { ok: false, error: `Brevo rejected the API key (${res.status}).` };
      } catch (e) {
        return { ok: false, error: `Could not reach Brevo: ${(e as Error).message}` };
      }
    }
    if (!host || !user || !pass) return { ok: false, error: 'SMTP not configured' };
    try {
      await this.transporter(host, port, secure, user, pass).verify();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: explainSmtpError(e as Error, port) };
    }
  }

  /** Sends an email; returns {sent:false} (logged) when SMTP is not configured. */
  async send(input: MailInput): Promise<{ sent: boolean; error?: string }> {
    const { host, port, secure, user, pass, apiKey, from: configuredFrom } =
      await this.resolveConfig();
    const from = input.from ?? configuredFrom;

    // Preferred when available: it survives a platform that blocks SMTP ports.
    if (apiKey && from) return this.sendViaApi(apiKey, from, input);

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
        cc: input.cc?.length ? input.cc : undefined,
        messageId: input.messageId,
        headers: input.headers,
        attachments: input.attachments?.length ? input.attachments : undefined,
      });
      return { sent: true };
    } catch (e) {
      const message = explainSmtpError(e as Error, port);
      this.logger.error(`Email send failed: ${message}`);
      return { sent: false, error: message };
    }
  }
}


/** Splits "Name <a@b.c>" into the shape Brevo's API expects. */
function parseAddress(raw: string): { name?: string; email: string } | null {
  const value = raw.trim();
  const angled = value.match(/^(.*)<([^>]+)>\s*$/);
  if (angled) {
    const name = angled[1].trim().replace(/^["']|["']$/g, '').trim();
    return { email: angled[2].trim(), name: name || undefined };
  }
  return /\S+@\S+\.\S+/.test(value) ? { email: value } : null;
}

function splitAddresses(raw: string): { email: string; name?: string }[] {
  return raw
    .split(',')
    .map((part) => parseAddress(part))
    .filter((a): a is { name?: string; email: string } => Boolean(a));
}

/**
 * A bare "Connection timeout" sends people hunting through their password.
 * The usual cause is the host blocking outbound SMTP ports, so say so.
 */
function explainSmtpError(e: Error, port: number): string {
  const message = e.message || String(e);
  const timedOut = /timeout|ETIMEDOUT|ECONNREFUSED|ESOCKET/i.test(message);
  if (!timedOut) return message;
  return (
    `${message}. The mail server could not be reached on port ${port}. ` +
    'Hosting platforms often block outbound SMTP: try port 2525, or paste a Brevo API key above to send over HTTPS instead.'
  );
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
