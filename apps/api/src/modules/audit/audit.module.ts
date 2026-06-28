import {
  CallHandler,
  Controller,
  ExecutionContext,
  Get,
  Global,
  Injectable,
  Logger,
  Module,
  NestInterceptor,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';

type ReqLike = {
  method: string;
  originalUrl?: string;
  url: string;
  ip?: string;
  body?: Record<string, unknown>;
  user?: { id?: string; email?: string };
  headers: Record<string, string | string[] | undefined>;
};

/** Writes to the audit trail. Fire-and-forget: never throws into the request. */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async record(entry: {
    action: string;
    status?: 'ok' | 'error';
    userId?: string;
    actorEmail?: string;
    entityType?: string;
    entityId?: string;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          status: entry.status ?? 'ok',
          userId: entry.userId,
          actorEmail: entry.actorEmail,
          entityType: entry.entityType,
          entityId: entry.entityId,
          ip: entry.ip,
          userAgent: entry.userAgent,
          metadata: (entry.metadata ?? undefined) as object | undefined,
        },
      });
    } catch (e) {
      this.logger.warn(`Audit write failed: ${(e as Error).message}`);
    }
  }

  /** Builds an audit entry from the HTTP request and records it. */
  fromRequest(req: ReqLike, status: 'ok' | 'error', errorMessage?: string) {
    const path = (req.originalUrl || req.url || '').split('?')[0];
    const isAuthLogin = path.endsWith('/auth/login');
    const segments = path.replace(/^\/api\//, '').split('/').filter(Boolean);
    const entityType = segments[0];
    const maybeId = segments[1];
    const ipHeader = req.headers['x-forwarded-for'];
    const ip =
      (Array.isArray(ipHeader) ? ipHeader[0] : ipHeader)?.split(',')[0]?.trim() || req.ip;

    const action = isAuthLogin
      ? status === 'ok' ? 'auth.login' : 'auth.login_failed'
      : `${req.method} ${path}`;

    void this.record({
      action,
      status,
      userId: req.user?.id,
      actorEmail: req.user?.email ?? (isAuthLogin ? String(req.body?.email ?? '') || undefined : undefined),
      entityType,
      entityId: maybeId && /^[a-z0-9]{16,}$/i.test(maybeId) ? maybeId : undefined,
      ip,
      userAgent: req.headers['user-agent'] as string | undefined,
      metadata: errorMessage ? { error: errorMessage } : undefined,
    });
  }
}

/** Logs every mutating request from an authenticated admin (and every login
 *  attempt) to the audit trail, success or failure. */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<ReqLike>();
    const method = req.method;
    const path = (req.originalUrl || req.url || '').split('?')[0];
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const isAuthLogin = path.endsWith('/auth/login');
    // Skip non-mutations, analytics ingestion, and reads of the audit log itself.
    if (!isMutation || path.startsWith('/api/analytics') || path.startsWith('/api/audit')) {
      return next.handle();
    }
    const shouldLog = () => Boolean(req.user) || isAuthLogin;
    return next.handle().pipe(
      tap(() => { if (shouldLog()) this.audit.fromRequest(req, 'ok'); }),
      catchError((err) => {
        if (shouldLog()) this.audit.fromRequest(req, 'error', (err as Error)?.message);
        return throwError(() => err);
      }),
    );
  }
}

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('audit')
export class AuditController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('action') action?: string,
    @Query('status') status?: string,
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(from || to
          ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
          : {}),
        ...(action ? { action: { contains: action, mode: 'insensitive' } } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }
}

@Global()
@Module({
  controllers: [AuditController],
  providers: [AuditService, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
