import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import {
  JwtPayloadSchema,
  type AuthUser,
  type ClaimRequest,
  type JwtPayload,
  type LoginRequest,
  type LoginResponse,
  type TokenPair,
} from '@reb/contracts';
import { InvitesService } from '../invites/invites.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly invites: InvitesService,
  ) {}

  /** Reivindica a conta de atleta via convite: cria o login PLAYER e emite tokens. */
  async claim(dto: ClaimRequest): Promise<LoginResponse> {
    const invite = await this.invites.findValidByCode(dto.code);

    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException({
        error: { code: 'EMAIL_EXISTS', message: 'E-mail já cadastrado' },
      });
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.users.createAthlete({
      email: dto.email,
      passwordHash,
      clubId: invite.clubId,
      playerId: invite.playerId,
      inviteId: invite.id,
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      clubId: user.clubId,
      playerId: user.playerId,
    };
    const tokens = await this.signTokens(authUser);
    return { ...tokens, user: authUser };
  }

  async login(dto: LoginRequest): Promise<LoginResponse> {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw this.invalidCredentials();
    }

    const passwordOk = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordOk) {
      throw this.invalidCredentials();
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      clubId: user.clubId,
      playerId: user.playerId,
    };
    const tokens = await this.signTokens(authUser);
    return { ...tokens, user: authUser };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      const raw = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      payload = JwtPayloadSchema.parse(raw);
    } catch {
      throw new UnauthorizedException({
        error: { code: 'INVALID_REFRESH', message: 'Refresh token inválido ou expirado' },
      });
    }

    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        error: { code: 'USER_INACTIVE', message: 'Usuário indisponível' },
      });
    }

    return this.signTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      clubId: user.clubId,
      playerId: user.playerId,
    });
  }

  private async signTokens(user: AuthUser): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      clubId: user.clubId,
      playerId: user.playerId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.getOrThrow<number>('JWT_ACCESS_TTL'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.getOrThrow<number>('JWT_REFRESH_TTL'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      error: { code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha inválidos' },
    });
  }
}
