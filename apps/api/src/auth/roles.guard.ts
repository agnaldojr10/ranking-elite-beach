import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@reb/contracts';
import { ROLES_KEY } from './roles.decorator';

/** Verifica se o usuário autenticado possui um dos papéis exigidos pela rota. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const role: Role | undefined = request.user?.role;

    if (!role || !required.includes(role)) {
      throw new ForbiddenException({
        error: { code: 'FORBIDDEN', message: 'Permissão insuficiente' },
      });
    }
    return true;
  }
}
