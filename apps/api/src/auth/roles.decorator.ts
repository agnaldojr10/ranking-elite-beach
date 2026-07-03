import { SetMetadata } from '@nestjs/common';
import type { Role } from '@reb/contracts';

export const ROLES_KEY = 'roles';

/** Restringe uma rota aos papéis informados (usar junto de JwtAuthGuard + RolesGuard). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
