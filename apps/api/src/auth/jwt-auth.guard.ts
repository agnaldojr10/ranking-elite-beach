import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guard de autenticação via JWT de acesso (estratégia 'jwt'). */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
