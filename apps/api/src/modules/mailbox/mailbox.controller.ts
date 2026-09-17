import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  ServiceUnavailableException,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { timingSafeEqual } from 'node:crypto';
import { MailThreadState, Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';
import { MailService } from '../mail/mail.module';
import { IntegrationsService } from '../integrations/integrations.module';
import { storeFile } from '../media/media.module';
import { MailboxService } from './mailbox.service';
import { IncomingFile, normalizeInbound } from './mail-parse';
import {
  AssignThreadDto,
  ComposeDto,
  CreateMailboxDto,
  ReplyDto,
  SetMembersDto,
  UpdateMailboxDto,
  UpdateThreadDto,
} from './mailbox.dto';

type AuthedRequest = { user?: { id?: string; email?: string; roles?: Role[] } };

/** Constant-time compare, so the webhook secret cannot be guessed byte by byte. */
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

@ApiTags('mailbox')
@Controller('mailbox')
export class MailboxController {
  constructor(
    private mailbox: MailboxService,
    private prisma: PrismaService,
    private mail: MailService,
    private integrations: IntegrationsService,
  ) {}

  // ── Inbound webhook ────────────────────────────────────────────────────────

  /**
   * Where delivered mail arrives. Called by the provider, not by a person, so
   * it is guarded by a shared secret rather than a JWT.
   *
   * The body shape differs per provider and is normalised downstream, so it is
   * deliberately untyped: the global ValidationPipe would otherwise reject the
   * provider's own field names as unknown properties.
   */
  @ApiExcludeEndpoint()
  @Throttle({ default: { limit: 600, ttl: 60_000 } })
  @UseInterceptors(AnyFilesInterceptor({ limits: { fileSize: 20 * 1024 * 1024, files: 20 } }))
  @Post('inbound')
  async inbound(
    @Body() body: Record<string, unknown>,
    @UploadedFiles() files: IncomingFile[] | undefined,
    @Req() req: { headers: Record<string, string | string[] | undefined> },
    @Query('secret') secretQuery?: string,
  ) {
    const expected = await this.mailbox.inboundSecret();
    if (!expected) {
      throw new ForbiddenException(
        'Inbound mail is not enabled. Generate a webhook secret under Admin, Mailbox, Setup.',
      );
    }

    const header = req.headers['x-mailbox-secret'];
    const provided = (Array.isArray(header) ? header[0] : header) ?? secretQuery ?? '';
    if (!provided || !secretMatches(provided, expected)) {
      throw new UnauthorizedException('Invalid webhook secret.');
    }

    const mail = normalizeInbound(body ?? {}, files ?? []);
    if (!mail) throw new BadRequestException('Payload carried no sender address.');

    const result = await this.mailbox.deliver(mail);
    // A 200 with delivered:false stops the provider retrying mail that will
    // never route; the admin sees the unrouted address in the response log.
    return result;
  }

  // ── Setup ──────────────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('setup')
  async setup() {
    const [secret, smtpReady, mailboxCount] = await Promise.all([
      this.mailbox.inboundSecret(),
      this.mail.isConfigured(),
      this.prisma.mailbox.count(),
    ]);
    // Prefer the API's own public origin: pointing the provider straight at it
    // avoids buffering a 25MB message through the web proxy on the way in.
    //
    // Platforms commonly set this host-only ("app.up.railway.app"). A URL with
    // no scheme is not a URL the Worker's fetch() can use, and it fails at
    // delivery time rather than at setup, so the scheme is added here.
    const configured = (process.env.API_URL ?? '').trim().replace(/\/+$/, '');
    const origin = configured && !/^https?:\/\//i.test(configured)
      ? `https://${configured}`
      : configured;
    return {
      inboundReady: Boolean(secret),
      // Never returns the secret itself; it is shown once, at rotation.
      sendingReady: smtpReady,
      mailboxCount,
      webhookPath: '/api/mailbox/inbound',
      webhookUrl: origin ? `${origin}/api/mailbox/inbound` : null,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post('setup/secret')
  async rotateSecret() {
    const secret = await this.mailbox.rotateInboundSecret();
    return { secret };
  }

  // ── Mailboxes ──────────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('mailboxes')
  async listMailboxes(@Req() req: AuthedRequest) {
    const access = await this.mailbox.accessFor(req.user);
    return this.prisma.mailbox.findMany({
      where: access.all ? {} : { id: { in: access.mailboxIds } },
      include: {
        members: {
          select: {
            userId: true,
            canSend: true,
            canManage: true,
            user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { address: 'asc' }],
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post('mailboxes')
  async createMailbox(@Body() dto: CreateMailboxDto) {
    const address = dto.address.trim().toLowerCase();
    const existing = await this.prisma.mailbox.findUnique({ where: { address } });
    if (existing) throw new BadRequestException(`${address} already exists.`);
    // Only one catch-all can win, so creating a new one retires the old.
    if (dto.isCatchAll) {
      await this.prisma.mailbox.updateMany({ where: { isCatchAll: true }, data: { isCatchAll: false } });
    }
    return this.prisma.mailbox.create({ data: { ...dto, address } });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch('mailboxes/:id')
  async updateMailbox(@Param('id') id: string, @Body() dto: UpdateMailboxDto) {
    if (dto.isCatchAll) {
      await this.prisma.mailbox.updateMany({
        where: { isCatchAll: true, id: { not: id } },
        data: { isCatchAll: false },
      });
    }
    const data = { ...dto, ...(dto.address ? { address: dto.address.trim().toLowerCase() } : {}) };
    return this.prisma.mailbox.update({ where: { id }, data });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Delete('mailboxes/:id')
  async deleteMailbox(@Param('id') id: string) {
    // Deleting cascades to every conversation in it, so the count is surfaced
    // first and the admin screen confirms against it.
    const threads = await this.prisma.mailThread.count({ where: { mailboxId: id } });
    await this.prisma.mailbox.delete({ where: { id } });
    return { deleted: true, threadsRemoved: threads };
  }

  // ── Conversations ──────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('counts')
  async counts(@Req() req: AuthedRequest) {
    return this.mailbox.counts(await this.mailbox.accessFor(req.user));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  // Who a conversation may be handed to: anyone with access to an address,
  // plus the super admins who implicitly have access to all of them.
  @Get('staff')
  staff() {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [{ roles: { has: Role.SUPER_ADMIN } }, { mailboxAccess: { some: {} } }],
      },
      select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      orderBy: { firstName: 'asc' },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('threads')
  async threads(
    @Req() req: AuthedRequest,
    @Query('mailboxId') mailboxId?: string,
    @Query('state') state?: string,
    @Query('search') search?: string,
    @Query('starred') starred?: string,
    @Query('unread') unread?: string,
    @Query('sent') sent?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const validState =
      state && (Object.values(MailThreadState) as string[]).includes(state)
        ? (state as MailThreadState)
        : undefined;
    const access = await this.mailbox.accessFor(req.user);
    return this.mailbox.listThreads({
      mailboxId: mailboxId || undefined,
      state: validState,
      search: search || undefined,
      starred: starred === 'true',
      unread: unread === 'true',
      sent: sent === 'true',
      assignedToId: assignedToId || undefined,
      take: take ? Number(take) : undefined,
      skip: skip ? Number(skip) : undefined,
    }, access);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('threads/:id')
  async thread(@Param('id') id: string, @Req() req: AuthedRequest) {
    const access = await this.mailbox.accessFor(req.user);
    const thread = await this.mailbox.getThread(id, access);
    if (!thread.isRead) await this.mailbox.markRead(id, true, access);
    return { ...thread, isRead: true, canSend: access.canSend(thread.mailboxId) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('threads/:id')
  async updateThread(@Param('id') id: string, @Body() dto: UpdateThreadDto, @Req() req: AuthedRequest) {
    const access = await this.mailbox.accessFor(req.user);
    if (dto.state) return this.mailbox.setState(id, dto.state, access);
    if (dto.isStarred !== undefined) return this.mailbox.setStarred(id, dto.isStarred, access);
    if (dto.isRead !== undefined) return this.mailbox.markRead(id, dto.isRead, access);
    throw new BadRequestException('Nothing to update.');
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('threads/:id/assign')
  async assign(@Param('id') id: string, @Body() dto: AssignThreadDto, @Req() req: AuthedRequest) {
    return this.mailbox.assign(id, dto.assignedToId ?? null, await this.mailbox.accessFor(req.user));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('threads/:id/reply')
  async reply(@Param('id') id: string, @Body() dto: ReplyDto, @Req() req: AuthedRequest) {
    return this.mailbox.reply(
      id,
      req.user?.id ?? null,
      dto.body,
      await this.mailbox.accessFor(req.user),
      dto.cc,
      dto.attachments,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('compose')
  async compose(@Body() dto: ComposeDto, @Req() req: AuthedRequest) {
    return this.mailbox.compose({
      mailboxId: dto.mailboxId,
      userId: req.user?.id ?? null,
      to: dto.to,
      cc: dto.cc,
      subject: dto.subject,
      body: dto.body,
      attachments: dto.attachments,
      access: await this.mailbox.accessFor(req.user),
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('threads/:id')
  async destroy(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.mailbox.destroy(id, await this.mailbox.accessFor(req.user));
  }

  /**
   * Stores a file for attaching to an outgoing message.
   *
   * The shared media upload is gated on admin roles, which someone who only
   * answers email deliberately does not have. Permission here is the same one
   * that governs sending: if you may send from an address, you may attach.
   */
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  @Post('attachments')
  async attach(
    @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer } | undefined,
    @Req() req: AuthedRequest,
  ) {
    const access = await this.mailbox.accessFor(req.user);
    const maySend = access.all || access.mailboxIds.some((id) => access.canSend(id));
    if (!maySend) throw new ForbiddenException('You cannot send from any address.');
    if (!file) throw new BadRequestException('No file received.');

    const stored = await storeFile(
      this.integrations,
      {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      },
      'mail-outgoing',
    );
    if (!stored) {
      throw new ServiceUnavailableException(
        'File storage is not set up. Add free Cloudinary details under Integrations, or attach a link instead.',
      );
    }
    return {
      fileName: file.originalname,
      url: stored.url,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    };
  }

  // ── Who may work in an address ─────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('mailboxes/:id/members')
  members(@Param('id') id: string) {
    return this.prisma.mailboxMember.findMany({
      where: { mailboxId: id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      },
    });
  }

  /** Replaces the whole member list for an address in one call. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Put('mailboxes/:id/members')
  async setMembers(@Param('id') id: string, @Body() dto: SetMembersDto) {
    const mailbox = await this.prisma.mailbox.findUnique({ where: { id }, select: { id: true } });
    if (!mailbox) throw new BadRequestException('Address not found.');

    const wanted = dto.members.filter((m, i, a) => a.findIndex((x) => x.userId === m.userId) === i);
    await this.prisma.$transaction([
      this.prisma.mailboxMember.deleteMany({
        where: { mailboxId: id, userId: { notIn: wanted.map((m) => m.userId) } },
      }),
      ...wanted.map((m) =>
        this.prisma.mailboxMember.upsert({
          where: { mailboxId_userId: { mailboxId: id, userId: m.userId } },
          update: { canSend: m.canSend ?? true, canManage: m.canManage ?? false },
          create: {
            mailboxId: id,
            userId: m.userId,
            canSend: m.canSend ?? true,
            canManage: m.canManage ?? false,
          },
        }),
      ),
    ]);
    return this.members(id);
  }
}
