import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayloadSchema, type JwtPayload } from '@reb/contracts';

/** Valida o access token e injeta o payload em request.user. */
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: unknown): JwtPayload {
    const parsed = JwtPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw new UnauthorizedException({
        error: { code: 'INVALID_TOKEN', message: 'Token inválido' },
      });
    }
    return parsed.data;
  }
}
