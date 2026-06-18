import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Role } from '@cps/database';
import { ROLES_KEY } from './roles.decorator';

/** Validates the JWT access token. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

/** Enforces RBAC after authentication. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    const granted = user?.roles?.some((r: Role) => required.includes(r));
    if (!granted) {
      throw new ForbiddenException('Insufficient role permissions');
    }
    return true;
  }
}
