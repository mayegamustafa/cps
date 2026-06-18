import { SetMetadata } from '@nestjs/common';
import type { Role } from '@cps/database';

export const ROLES_KEY = 'roles';

/** Restrict a route to one or more RBAC roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
