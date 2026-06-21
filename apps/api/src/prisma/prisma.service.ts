import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@cps/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // Connect eagerly, but don't crash the app if the DB is briefly unavailable
    // at boot — Prisma will connect lazily on the first query, and /api/health
    // reports DB status. This keeps the service up through transient DB hiccups.
    try {
      await this.$connect();
    } catch (e) {
      this.logger.error(`Initial DB connection failed (will retry on demand): ${(e as Error).message}`);
    }
  }
}
