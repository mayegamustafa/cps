import { Module } from '@nestjs/common';
import { MailboxController } from './mailbox.controller';
import { MailboxService } from './mailbox.service';

/**
 * School email delivered into the portal. MailService and IntegrationsService
 * are global, so nothing extra needs importing here.
 */
@Module({
  controllers: [MailboxController],
  providers: [MailboxService],
  exports: [MailboxService],
})
export class MailboxModule {}
