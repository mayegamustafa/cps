import { Controller, Get, Module, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ApplicationStatus,
  MailThreadState,
  ModerationStatus,
  Role,
} from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/guards';
import { MailboxModule } from '../mailbox/mailbox.module';
import { MailboxService } from '../mailbox/mailbox.service';

type AuthedRequest = { user?: { id?: string; roles?: Role[] } };

/**
 * Counts of things waiting for someone, for the badges on the admin sidebar.
 *
 * Only states that clear are counted. A badge that can never reach zero teaches
 * people to ignore every badge, so screens with nothing to mark as dealt with
 * (Forms, Alumni, Downloads) deliberately have none rather than showing a total
 * that only ever grows.
 */
@ApiTags('badges')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('badges')
export class BadgesController {
  constructor(
    private prisma: PrismaService,
    private mailbox: MailboxService,
  ) {}

  @Get()
  async counts(@Req() req: AuthedRequest) {
    const access = await this.mailbox.accessFor(req.user);
    const mailboxScope = access.all ? {} : { mailboxId: { in: access.mailboxIds } };

    const [messages, admissions, jobApplications, social, mail] = await Promise.all([
      // Cleared by the Handled toggle on the contact inbox.
      this.prisma.contactMessage.count({ where: { handled: false } }),
      // Cleared by moving an application past its initial review.
      this.prisma.admissionApplication.count({
        where: { status: { in: [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW] } },
      }),
      // Cleared once an application is shortlisted, rejected or withdrawn.
      this.prisma.jobApplication.count({ where: { status: ApplicationStatus.SUBMITTED } }),
      // Cleared by approving or hiding the pulled-in post.
      this.prisma.socialPost.count({ where: { moderation: ModerationStatus.PENDING } }),
      // Cleared by opening the conversation, and scoped to the addresses this
      // person may see, so staff never see a count they cannot act on.
      this.prisma.mailThread.count({
        where: { ...mailboxScope, state: MailThreadState.OPEN, isRead: false },
      }),
    ]);

    return { messages, admissions, jobApplications, social, mailbox: mail };
  }
}

@Module({ imports: [MailboxModule], controllers: [BadgesController] })
export class BadgesModule {}
