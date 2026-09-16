import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { MailDirection, MailThreadState, Prisma } from '@cps/database';
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
    mailbox: { address: string; displayName: string; autoReplySubject: string | null; autoReplyBody: string | null },
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

  private bodyToHtml(text: string, signature?: string | null, quote?: string | null): string {
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
    return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#2b2b2b;">${paragraphs}${sig}${quoted}</div>`;
  }

  /** Sends a message as a mailbox and records it on the thread either way. */
  private async sendOutbound(opts: {
    threadId: string;
    mailbox: { address: string; displayName: string; signature?: string | null };
    to: string[];
    cc: string[];
    subject: string;
    bodyText: string;
    inReplyTo: string | null;
    references: string[];
    sentById: string | null;
    quote: string | null;
  }) {
    const messageId = this.newMessageId(opts.mailbox.address);
    const references = [...opts.references, ...(opts.inReplyTo ? [opts.inReplyTo] : [])]
      .filter((v, i, a) => v && a.indexOf(v) === i)
      .slice(-20);

    const signature = 'signature' in opts.mailbox ? opts.mailbox.signature : null;
    const html = this.bodyToHtml(opts.bodyText, signature, opts.quote);

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
      },
    });

    await this.prisma.mailThread.update({
      where: { id: opts.threadId },
      data: {
        snippet: snippetOf(opts.bodyText),
        lastMessageAt: new Date(),
        isRead: true,
        messageCount: { increment: 1 },
      },
    });

    return { ...result, message: stored };
  }

  /** Replies to an existing conversation as the mailbox that received it. */
  async reply(threadId: string, userId: string | null, bodyText: string, ccOverride?: string[]) {
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
  }) {
    const mailbox = await this.prisma.mailbox.findUnique({ where: { id: input.mailboxId } });
    if (!mailbox) throw new NotFoundException('Mailbox not found.');
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
    });

    return { ...sent, threadId: thread.id };
  }

  // ── Reading ────────────────────────────────────────────────────────────────

  /** Unread and total counts per mailbox, for the sidebar badges. */
  async counts() {
    const [byMailbox, unassigned] = await Promise.all([
      this.prisma.mailThread.groupBy({
        by: ['mailboxId'],
        where: { state: MailThreadState.OPEN, isRead: false },
        _count: { _all: true },
      }),
      this.prisma.mailThread.count({
        where: { state: MailThreadState.OPEN, assignedToId: null },
      }),
    ]);

    const [starred, archived, spam, trash] = await Promise.all([
      this.prisma.mailThread.count({ where: { isStarred: true, state: { not: MailThreadState.TRASH } } }),
      this.prisma.mailThread.count({ where: { state: MailThreadState.ARCHIVED } }),
      this.prisma.mailThread.count({ where: { state: MailThreadState.SPAM } }),
      this.prisma.mailThread.count({ where: { state: MailThreadState.TRASH } }),
    ]);

    return {
      unread: Object.fromEntries(byMailbox.map((r) => [r.mailboxId, r._count._all])),
      totalUnread: byMailbox.reduce((sum, r) => sum + r._count._all, 0),
      unassigned,
      starred,
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
    assignedToId?: string;
    search?: string;
    take?: number;
    skip?: number;
  }) {
    const where: Prisma.MailThreadWhereInput = {
      ...(q.mailboxId ? { mailboxId: q.mailboxId } : {}),
      ...(q.starred ? { isStarred: true } : {}),
      ...(q.unread ? { isRead: false } : {}),
      ...(q.assignedToId ? { assignedToId: q.assignedToId } : {}),
      // Starred is a view across mailboxes, so it must not also filter to OPEN.
      ...(q.state ? { state: q.state } : q.starred ? { state: { not: MailThreadState.TRASH } } : {}),
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
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.mailThread.count({ where }),
    ]);

    return { items, total, take };
  }

  async getThread(id: string) {
    const thread = await this.prisma.mailThread.findUnique({
      where: { id },
      include: {
        mailbox: { select: { id: true, address: true, displayName: true, signature: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { attachments: true, sentBy: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!thread) throw new NotFoundException('Conversation not found.');
    return thread;
  }

  /** Opening a conversation marks it read, the way any mail client behaves. */
  async markRead(id: string, isRead = true) {
    return this.prisma.mailThread.update({ where: { id }, data: { isRead } });
  }

  async setState(id: string, state: MailThreadState) {
    return this.prisma.mailThread.update({ where: { id }, data: { state } });
  }

  async setStarred(id: string, isStarred: boolean) {
    return this.prisma.mailThread.update({ where: { id }, data: { isStarred } });
  }

  async assign(id: string, assignedToId: string | null) {
    return this.prisma.mailThread.update({
      where: { id },
      data: { assignedToId },
      include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  /** Permanently removes a conversation and everything hanging off it. */
  async destroy(id: string) {
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
