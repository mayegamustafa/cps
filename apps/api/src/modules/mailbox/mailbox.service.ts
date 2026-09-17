import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { MailDirection, MailThreadState, Prisma, Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationsService } from '../integrations/integrations.module';
import { MailService } from '../mail/mail.module';
import { storeFile } from '../media/media.module';
import {
  NormalizedAttachment,
  NormalizedMail,
  htmlToText,
  snippetOf,
  subjectKeyOf,
} from './mail-parse';

/** Anything larger is recorded by name only; the message itself still arrives. */
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

/** How far back a subject-plus-sender match may reach when headers are missing. */
const FALLBACK_THREAD_WINDOW_DAYS = 180;

/** A file already in storage, attached to an outgoing message by URL. */
export type OutgoingAttachment = {
  fileName: string;
  url: string;
  mimeType?: string;
  sizeBytes?: number;
};

/** What one signed-in staff member may do, resolved once per request. */
export type MailAccess = {
  /** True for SUPER_ADMIN, who works in every address. */
  all: boolean;
  mailboxIds: string[];
  canSend(mailboxId: string): boolean;
  canManage(mailboxId: string): boolean;
};

export type DeliveryResult =
  | { delivered: true; threadId: string; messageId: string; duplicate: false }
  | { delivered: true; threadId: string; messageId: string; duplicate: true }
  | { delivered: false; reason: string };

@Injectable()
export class MailboxService {
  private readonly logger = new Logger(MailboxService.name);

  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private integrations: IntegrationsService,
  ) {}

  // ── Access ─────────────────────────────────────────────────────────────────

  /**
   * Resolves which addresses this person may work in. Everything that reads or
   * writes mail goes through here first, so a staff member assigned to one
   * address can never see another one's conversations, not even by guessing an
   * id.
   */
  async accessFor(user?: { id?: string; roles?: Role[] }): Promise<MailAccess> {
    if (user?.roles?.includes(Role.SUPER_ADMIN)) {
      return { all: true, mailboxIds: [], canSend: () => true, canManage: () => true };
    }
    if (!user?.id) {
      return { all: false, mailboxIds: [], canSend: () => false, canManage: () => false };
    }
    const rows = await this.prisma.mailboxMember.findMany({
      where: { userId: user.id, mailbox: { isActive: true } },
      select: { mailboxId: true, canSend: true, canManage: true },
    });
    const send = new Set(rows.filter((r) => r.canSend).map((r) => r.mailboxId));
    const manage = new Set(rows.filter((r) => r.canManage).map((r) => r.mailboxId));
    return {
      all: false,
      mailboxIds: rows.map((r) => r.mailboxId),
      canSend: (id) => send.has(id),
      canManage: (id) => manage.has(id),
    };
  }

  /** A where-clause fragment limiting threads to what this person may see. */
  private scope(access: MailAccess): Prisma.MailThreadWhereInput {
    return access.all ? {} : { mailboxId: { in: access.mailboxIds } };
  }

  /** Loads a thread only if this person may see it, and says which mailbox it is in. */
  private async threadInScope(id: string, access: MailAccess) {
    const thread = await this.prisma.mailThread.findUnique({
      where: { id },
      select: { id: true, mailboxId: true },
    });
    if (!thread) throw new NotFoundException('Conversation not found.');
    if (!access.all && !access.mailboxIds.includes(thread.mailboxId)) {
      // Deliberately the same error as a missing thread, so this cannot be used
      // to discover which conversations exist in another address.
      throw new NotFoundException('Conversation not found.');
    }
    return thread;
  }

  // ── Inbound ────────────────────────────────────────────────────────────────

  /** The secret the webhook must present, from admin Integrations then env. */
  async inboundSecret(): Promise<string | undefined> {
    const stored = (await this.integrations.get()).mailbox?.inboundSecret;
    return stored || process.env.MAIL_INBOUND_SECRET || undefined;
  }

  /**
   * Picks the mailbox a message belongs to: an exact address match on any
   * recipient first, then the catch-all. Mail for an address nobody created is
   * rejected rather than silently pooled, so the admin sees it is unrouted.
   */
  private async resolveMailbox(mail: NormalizedMail) {
    const candidates = [...mail.to, ...mail.cc].map((a) => a.email.toLowerCase());

    if (candidates.length) {
      const exact = await this.prisma.mailbox.findFirst({
        where: { isActive: true, address: { in: candidates, mode: 'insensitive' } },
        orderBy: { sortOrder: 'asc' },
      });
      if (exact) return exact;
    }

    return this.prisma.mailbox.findFirst({
      where: { isActive: true, isCatchAll: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Finds the conversation a message continues.
   *
   * Message-ID chains are authoritative, so they are tried first. When the
   * sending client drops them, a same-subject message from the same person
   * inside the window is treated as the same conversation, which is what the
   * office staff expect to see.
   */
  private async findThread(mailboxId: string, mail: NormalizedMail) {
    const chain = [mail.inReplyTo, ...mail.references].filter((id): id is string => Boolean(id));
    if (chain.length) {
      const parent = await this.prisma.mailMessage.findFirst({
        where: { messageId: { in: chain }, thread: { mailboxId } },
        orderBy: { createdAt: 'desc' },
        select: { threadId: true },
      });
      if (parent) {
        return this.prisma.mailThread.findUnique({ where: { id: parent.threadId } });
      }
    }

    const since = new Date(Date.now() - FALLBACK_THREAD_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    return this.prisma.mailThread.findFirst({
      where: {
        mailboxId,
        subjectKey: subjectKeyOf(mail.subject),
        participant: mail.from.email,
        state: { not: MailThreadState.TRASH },
        lastMessageAt: { gte: since },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  /**
   * Stores attachments with the shared uploader. A storage failure must not
   * cost the school the email, so the record is kept with a null url and the
   * admin screen shows the file as unavailable.
   */
  private async persistAttachments(messageId: string, attachments: NormalizedAttachment[]) {
    for (const att of attachments) {
      const oversized = att.content.length > MAX_ATTACHMENT_BYTES;
      let url: string | null = null;

      if (!oversized) {
        try {
          const stored = await storeFile(
            this.integrations,
            {
              originalname: att.fileName,
              mimetype: att.mimeType,
              size: att.content.length,
              buffer: att.content,
            },
            'mail',
          );
          url = stored?.url ?? null;
        } catch (e) {
          this.logger.warn(`Attachment "${att.fileName}" not stored: ${(e as Error).message}`);
        }
      }

      await this.prisma.mailAttachment.create({
        data: {
          messageId,
          fileName: att.fileName.slice(0, 250),
          mimeType: att.mimeType.slice(0, 150),
          sizeBytes: att.content.length,
          url,
          contentId: att.contentId ?? null,
          isInline: att.isInline,
        },
      });
    }
  }

  /** Files a delivered message into a mailbox, creating or continuing a thread. */
  async deliver(mail: NormalizedMail): Promise<DeliveryResult> {
    const mailbox = await this.resolveMailbox(mail);
    if (!mailbox) {
      const attempted = [...mail.to, ...mail.cc].map((a) => a.email).join(', ') || 'unknown';
      return { delivered: false, reason: `No active mailbox for ${attempted}` };
    }

    // A provider that retries after a timeout must not create a second copy.
    if (mail.messageId) {
      const existing = await this.prisma.mailMessage.findUnique({
        where: { messageId: mail.messageId },
        select: { id: true, threadId: true },
      });
      if (existing) {
        return {
          delivered: true,
          threadId: existing.threadId,
          messageId: existing.id,
          duplicate: true,
        };
      }
    }

    const snippet = snippetOf(mail.text, mail.html);
    const hasAttachments = mail.attachments.some((a) => !a.isInline);
    const spam = mail.isSpam;

    let thread = await this.findThread(mailbox.id, mail);
    if (thread) {
      thread = await this.prisma.mailThread.update({
        where: { id: thread.id },
        data: {
          snippet,
          isRead: false,
          lastMessageAt: new Date(),
          messageCount: { increment: 1 },
          hasAttachments: thread.hasAttachments || hasAttachments,
          // A reply pulls an archived conversation back into the inbox.
          state: thread.state === MailThreadState.ARCHIVED ? MailThreadState.OPEN : thread.state,
        },
      });
    } else {
      thread = await this.prisma.mailThread.create({
        data: {
          mailboxId: mailbox.id,
          subject: mail.subject.slice(0, 500),
          subjectKey: subjectKeyOf(mail.subject),
          participant: mail.from.email,
          participantName: mail.from.name?.slice(0, 200) ?? null,
          snippet,
          state: spam ? MailThreadState.SPAM : MailThreadState.OPEN,
          isRead: false,
          messageCount: 1,
          hasAttachments,
          lastMessageAt: new Date(),
        },
      });
    }

    const message = await this.prisma.mailMessage.create({
      data: {
        threadId: thread.id,
        direction: MailDirection.INBOUND,
        messageId: mail.messageId ?? null,
        inReplyTo: mail.inReplyTo ?? null,
        references: mail.references,
        fromName: mail.from.name?.slice(0, 200) ?? null,
        fromEmail: mail.from.email,
        toEmails: mail.to.map((a) => a.email),
        ccEmails: mail.cc.map((a) => a.email),
        subject: mail.subject.slice(0, 500),
        text: mail.text ?? (mail.html ? htmlToText(mail.html) : null),
        html: mail.html ?? null,
        spamScore: mail.spamScore ?? null,
        isSpam: spam,
        headers: (mail.headers ?? undefined) as Prisma.InputJsonValue | undefined,
        sizeBytes: mail.sizeBytes ?? null,
      },
    });

    if (mail.attachments.length) {
      await this.persistAttachments(message.id, mail.attachments);
    }

    // Auto-reply only to a fresh, non-spam conversation, so a back-and-forth
    // never turns into two robots answering each other.
    if (mailbox.autoReplyEnabled && !spam && thread.messageCount <= 1) {
      void this.sendAutoReply(mailbox, mail, thread.id, message.messageId).catch((e) =>
        this.logger.warn(`Auto-reply failed: ${(e as Error).message}`),
      );
    }

    return { delivered: true, threadId: thread.id, messageId: message.id, duplicate: false };
  }

  private async sendAutoReply(
    mailbox: {
      address: string;
      displayName: string;
      avatarUrl: string | null;
      autoReplySubject: string | null;
      autoReplyBody: string | null;
    },
    mail: NormalizedMail,
    threadId: string,
    parentMessageId: string | null,
  ) {
    const body = mailbox.autoReplyBody?.trim();
    if (!body) return;
    await this.sendOutbound({
      threadId,
      mailbox,
      to: [mail.from.email],
      cc: [],
      subject: mailbox.autoReplySubject?.trim() || `Re: ${mail.subject}`,
      bodyText: body,
      inReplyTo: parentMessageId,
      references: parentMessageId ? [...mail.references, parentMessageId] : mail.references,
      sentById: null,
      quote: null,
    });
  }

  // ── Outbound ───────────────────────────────────────────────────────────────

  /** A Message-ID owned by us, so replies to it thread back to this conversation. */
  private newMessageId(address: string): string {
    const domain = address.split('@')[1] ?? 'localhost';
    return `<${randomUUID()}@${domain}>`;
  }

  /**
   * The sender's picture and name across the top of an outgoing message.
   *
   * Built as a table with inline styles because that is the only layout every
   * mail client agrees on, and omitted entirely when no picture is set so a
   * plain reply stays plain.
   */
  /**
   * The picture to show on an outgoing message: the address's own if one was
   * uploaded, otherwise the school badge, so mail is recognisable by default
   * rather than only when somebody remembers to set it.
   *
   * Mail clients cannot resolve a relative path, so a site logo stored as
   * "/cps.png" is only usable once the public web origin is known.
   */
  private async resolveBadge(avatarUrl?: string | null): Promise<string | null> {
    if (avatarUrl) return avatarUrl;

    const row = await this.prisma.siteSetting.findUnique({ where: { key: 'site' } });
    const brand = (row?.value as { brand?: { logoUrl?: string } } | null)?.brand;
    const logo = brand?.logoUrl?.trim();
    if (logo && /^https?:\/\//i.test(logo)) return logo;

    const origin = (
      process.env.WEB_ORIGIN ??
      process.env.PUBLIC_WEB_URL ??
      process.env.WEB_URL ??
      ''
    ).replace(/\/+$/, '');
    if (!origin) return null;
    const path = logo && logo.startsWith('/') ? logo : '/cps.png';
    return `${origin}${path}`;
  }

  private senderHeader(mailbox: { address: string; displayName: string; avatarUrl?: string | null }): string {
    if (!mailbox.avatarUrl) return '';
    const escape = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return (
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border-collapse:collapse;">` +
      `<tr>` +
      `<td style="padding-right:12px;vertical-align:middle;">` +
      `<img src="${escape(mailbox.avatarUrl)}" width="46" height="46" alt="" ` +
      `style="width:46px;height:46px;border-radius:23px;display:block;border:0;outline:none;text-decoration:none;" />` +
      `</td>` +
      `<td style="vertical-align:middle;">` +
      `<div style="font-size:15px;font-weight:bold;color:#6e1f23;line-height:1.3;">${escape(mailbox.displayName)}</div>` +
      `<div style="font-size:12px;color:#8a8a8a;line-height:1.3;">${escape(mailbox.address)}</div>` +
      `</td>` +
      `</tr>` +
      `</table>`
    );
  }

  private bodyToHtml(
    text: string,
    signature?: string | null,
    quote?: string | null,
    header = '',
  ): string {
    const escape = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const paragraphs = text
      .split(/\n{2,}/)
      .map((p) => `<p style="margin:0 0 12px;">${escape(p).replace(/\n/g, '<br>')}</p>`)
      .join('');
    const sig = signature?.trim()
      ? `<div style="margin-top:18px;color:#6b6b6b;font-size:13px;">${escape(signature).replace(/\n/g, '<br>')}</div>`
      : '';
    const quoted = quote?.trim()
      ? `<blockquote style="margin:18px 0 0;padding-left:12px;border-left:2px solid #d9d2d3;color:#6b6b6b;">${escape(
          quote,
        ).replace(/\n/g, '<br>')}</blockquote>`
      : '';
    return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#2b2b2b;">${header}${paragraphs}${sig}${quoted}</div>`;
  }

  /** Sends a message as a mailbox and records it on the thread either way. */
  private async sendOutbound(opts: {
    threadId: string;
    mailbox: { address: string; displayName: string; signature?: string | null; avatarUrl?: string | null };
    to: string[];
    cc: string[];
    subject: string;
    bodyText: string;
    inReplyTo: string | null;
    references: string[];
    sentById: string | null;
    quote: string | null;
    attachments?: OutgoingAttachment[];
  }) {
    const messageId = this.newMessageId(opts.mailbox.address);
    const references = [...opts.references, ...(opts.inReplyTo ? [opts.inReplyTo] : [])]
      .filter((v, i, a) => v && a.indexOf(v) === i)
      .slice(-20);

    const signature = 'signature' in opts.mailbox ? opts.mailbox.signature : null;
    const badge = await this.resolveBadge(opts.mailbox.avatarUrl);
    const html = this.bodyToHtml(
      opts.bodyText,
      signature,
      opts.quote,
      this.senderHeader({ ...opts.mailbox, avatarUrl: badge }),
    );

    const headers: Record<string, string> = {};
    if (opts.inReplyTo) headers['In-Reply-To'] = opts.inReplyTo;
    if (references.length) headers['References'] = references.join(' ');

    const result = await this.mail.send({
      to: opts.to.join(', '),
      cc: opts.cc,
      subject: opts.subject,
      html,
      text: opts.bodyText + (signature ? `\n\n${signature}` : ''),
      from: `${opts.mailbox.displayName} <${opts.mailbox.address}>`,
      replyTo: opts.mailbox.address,
      messageId,
      headers,
      // nodemailer streams each file from its URL at send time, so a large
      // attachment never sits in this process's memory.
      attachments: opts.attachments?.map((a) => ({
        filename: a.fileName,
        path: a.url,
        contentType: a.mimeType,
      })),
    });

    // Recorded even when SMTP is not configured, so the thread shows what the
    // staff member wrote and the error explaining why it did not leave.
    const stored = await this.prisma.mailMessage.create({
      data: {
        threadId: opts.threadId,
        direction: MailDirection.OUTBOUND,
        messageId,
        inReplyTo: opts.inReplyTo,
        references,
        fromName: opts.mailbox.displayName,
        fromEmail: opts.mailbox.address,
        toEmails: opts.to,
        ccEmails: opts.cc,
        subject: opts.subject.slice(0, 500),
        text: opts.bodyText,
        html,
        sentById: opts.sentById,
        deliveryError: result.sent ? null : result.error ?? 'Unknown send failure',
        attachments: opts.attachments?.length
          ? {
              create: opts.attachments.map((a) => ({
                fileName: a.fileName.slice(0, 250),
                mimeType: (a.mimeType ?? 'application/octet-stream').slice(0, 150),
                sizeBytes: a.sizeBytes ?? 0,
                url: a.url,
                isInline: false,
              })),
            }
          : undefined,
      },
      include: { attachments: true },
    });

    await this.prisma.mailThread.update({
      where: { id: opts.threadId },
      data: {
        snippet: snippetOf(opts.bodyText),
        lastMessageAt: new Date(),
        isRead: true,
        messageCount: { increment: 1 },
        hasAttachments: opts.attachments?.length ? true : undefined,
      },
    });

    return { ...result, message: stored };
  }

  /** Replies to an existing conversation as the mailbox that received it. */
  async reply(
    threadId: string,
    userId: string | null,
    bodyText: string,
    access: MailAccess,
    ccOverride?: string[],
    attachments?: OutgoingAttachment[],
  ) {
    const scoped = await this.threadInScope(threadId, access);
    if (!access.canSend(scoped.mailboxId)) {
      throw new ForbiddenException('You can read this address but not send from it.');
    }
    const thread = await this.prisma.mailThread.findUnique({
      where: { id: threadId },
      include: {
        mailbox: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!thread) throw new NotFoundException('Conversation not found.');

    const last = thread.messages[0];
    const quote = last
      ? `On ${last.createdAt.toDateString()}, ${last.fromName || last.fromEmail} wrote:\n${(
          last.text ?? htmlToText(last.html)
        ).slice(0, 4000)}`
      : null;

    const subject = /^re:/i.test(thread.subject) ? thread.subject : `Re: ${thread.subject}`;

    return this.sendOutbound({
      threadId,
      mailbox: thread.mailbox,
      to: [thread.participant],
      cc: ccOverride ?? [],
      subject,
      bodyText,
      inReplyTo: last?.messageId ?? null,
      references: last?.references ?? [],
      sentById: userId,
      quote,
      attachments,
    });
  }

  /** Starts a brand new conversation from one of the school's addresses. */
  async compose(input: {
    mailboxId: string;
    userId: string | null;
    to: string[];
    cc?: string[];
    subject: string;
    body: string;
    access: MailAccess;
    attachments?: OutgoingAttachment[];
  }) {
    const mailbox = await this.prisma.mailbox.findUnique({ where: { id: input.mailboxId } });
    if (!mailbox) throw new NotFoundException('Mailbox not found.');
    if (!input.access.all && !input.access.mailboxIds.includes(mailbox.id)) {
      throw new NotFoundException('Mailbox not found.');
    }
    if (!input.access.canSend(mailbox.id)) {
      throw new ForbiddenException('You can read this address but not send from it.');
    }
    if (!input.to.length) throw new BadRequestException('Add at least one recipient.');

    const thread = await this.prisma.mailThread.create({
      data: {
        mailboxId: mailbox.id,
        subject: input.subject.slice(0, 500),
        subjectKey: subjectKeyOf(input.subject),
        participant: input.to[0].toLowerCase(),
        snippet: snippetOf(input.body),
        state: MailThreadState.OPEN,
        isRead: true,
        messageCount: 0,
        lastMessageAt: new Date(),
      },
    });

    const sent = await this.sendOutbound({
      threadId: thread.id,
      mailbox,
      to: input.to,
      cc: input.cc ?? [],
      subject: input.subject,
      bodyText: input.body,
      inReplyTo: null,
      references: [],
      sentById: input.userId,
      quote: null,
      attachments: input.attachments,
    });

    return { ...sent, threadId: thread.id };
  }

  // ── Reading ────────────────────────────────────────────────────────────────

  /** Unread and total counts per mailbox, for the sidebar badges. */
  async counts(access: MailAccess) {
    const mine = this.scope(access);
    const [byMailbox, unassigned] = await Promise.all([
      this.prisma.mailThread.groupBy({
        by: ['mailboxId'],
        where: { ...mine, state: MailThreadState.OPEN, isRead: false },
        _count: { _all: true },
      }),
      this.prisma.mailThread.count({
        where: { ...mine, state: MailThreadState.OPEN, assignedToId: null },
      }),
    ]);

    const [starred, sent, archived, spam, trash] = await Promise.all([
      this.prisma.mailThread.count({ where: { ...mine, isStarred: true, state: { not: MailThreadState.TRASH } } }),
      this.prisma.mailThread.count({
        where: {
          ...mine,
          state: { not: MailThreadState.TRASH },
          messages: { some: { direction: MailDirection.OUTBOUND } },
        },
      }),
      this.prisma.mailThread.count({ where: { ...mine, state: MailThreadState.ARCHIVED } }),
      this.prisma.mailThread.count({ where: { ...mine, state: MailThreadState.SPAM } }),
      this.prisma.mailThread.count({ where: { ...mine, state: MailThreadState.TRASH } }),
    ]);

    return {
      unread: Object.fromEntries(byMailbox.map((r) => [r.mailboxId, r._count._all])),
      totalUnread: byMailbox.reduce((sum, r) => sum + r._count._all, 0),
      unassigned,
      starred,
      sent,
      archived,
      spam,
      trash,
    };
  }

  async listThreads(q: {
    mailboxId?: string;
    state?: MailThreadState;
    starred?: boolean;
    unread?: boolean;
    sent?: boolean;
    assignedToId?: string;
    search?: string;
    take?: number;
    skip?: number;
  }, access: MailAccess) {
    // A requested mailbox is honoured only when it is one of theirs; otherwise
    // the query stays pinned to the set they may see.
    const requested =
      q.mailboxId && (access.all || access.mailboxIds.includes(q.mailboxId))
        ? { mailboxId: q.mailboxId }
        : this.scope(access);
    const where: Prisma.MailThreadWhereInput = {
      ...requested,
      ...(q.starred ? { isStarred: true } : {}),
      ...(q.unread ? { isRead: false } : {}),
      ...(q.assignedToId ? { assignedToId: q.assignedToId } : {}),
      // A conversation is "sent" once the school has answered in it at least once.
      ...(q.sent ? { messages: { some: { direction: MailDirection.OUTBOUND } } } : {}),
      // Starred and Sent are views across folders, so neither may pin state to OPEN.
      ...(q.state
        ? { state: q.state }
        : q.starred || q.sent
          ? { state: { not: MailThreadState.TRASH } }
          : {}),
    };

    if (q.search) {
      const term = q.search.trim();
      where.OR = [
        { subject: { contains: term, mode: 'insensitive' } },
        { snippet: { contains: term, mode: 'insensitive' } },
        { participant: { contains: term, mode: 'insensitive' } },
        { participantName: { contains: term, mode: 'insensitive' } },
        { messages: { some: { text: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    const take = Math.min(Math.max(q.take ?? 40, 1), 100);
    const [items, total] = await Promise.all([
      this.prisma.mailThread.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        take,
        skip: Math.max(q.skip ?? 0, 0),
        include: {
          mailbox: { select: { id: true, address: true, displayName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
      this.prisma.mailThread.count({ where }),
    ]);

    return { items, total, take };
  }

  async getThread(id: string, access: MailAccess) {
    await this.threadInScope(id, access);
    const thread = await this.prisma.mailThread.findUnique({
      where: { id },
      include: {
        mailbox: { select: { id: true, address: true, displayName: true, signature: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { attachments: true, sentBy: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        },
      },
    });
    if (!thread) throw new NotFoundException('Conversation not found.');
    return thread;
  }

  /** Opening a conversation marks it read, the way any mail client behaves. */
  async markRead(id: string, isRead: boolean, access: MailAccess) {
    await this.threadInScope(id, access);
    return this.prisma.mailThread.update({ where: { id }, data: { isRead } });
  }

  async setState(id: string, state: MailThreadState, access: MailAccess) {
    await this.threadInScope(id, access);
    return this.prisma.mailThread.update({ where: { id }, data: { state } });
  }

  async setStarred(id: string, isStarred: boolean, access: MailAccess) {
    await this.threadInScope(id, access);
    return this.prisma.mailThread.update({ where: { id }, data: { isStarred } });
  }

  async assign(id: string, assignedToId: string | null, access: MailAccess) {
    const scoped = await this.threadInScope(id, access);
    if (assignedToId) {
      // Handing a conversation to someone with no access to the address would
      // put it somewhere they cannot open.
      const member = await this.prisma.mailboxMember.findUnique({
        where: { mailboxId_userId: { mailboxId: scoped.mailboxId, userId: assignedToId } },
        select: { id: true },
      });
      if (!member) {
        const isSuper = await this.prisma.user.findFirst({
          where: { id: assignedToId, roles: { has: Role.SUPER_ADMIN } },
          select: { id: true },
        });
        if (!isSuper) {
          throw new BadRequestException('That person does not have access to this address.');
        }
      }
    }
    return this.prisma.mailThread.update({
      where: { id },
      data: { assignedToId },
      include: { assignedTo: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });
  }

  /** Permanently removes a conversation and everything hanging off it. */
  async destroy(id: string, access: MailAccess) {
    await this.threadInScope(id, access);
    await this.prisma.mailThread.delete({ where: { id } });
    return { deleted: true };
  }

  /** Generates and stores a fresh inbound webhook secret. */
  async rotateInboundSecret(): Promise<string> {
    const secret = randomBytes(24).toString('base64url');
    const current = await this.integrations.get();
    await this.integrations.save({
      ...current,
      mailbox: { ...current.mailbox, inboundSecret: secret },
    });
    return secret;
  }
}
