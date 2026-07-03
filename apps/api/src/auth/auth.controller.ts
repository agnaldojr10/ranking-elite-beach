import { Body, Controller, Get, HttpCode, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  LoginRequestSchema,
  RefreshRequestSchema,
  type AuthUser,
  type JwtPayload,
  type LoginRequest,
  type LoginResponse,
  type RefreshRequest,
  type TokenPair,
} from '@reb/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autentica e emite tokens' })
  login(
    @Body(new ZodValidationPipe(LoginRequestSchema)) dto: LoginRequest,
  ): Promise<LoginResponse> {
    return this.auth.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Renova o par de tokens' })
  refresh(
    @Body(new ZodValidationPipe(RefreshRequestSchema)) dto: RefreshRequest,
  ): Promise<TokenPair> {
    return this.auth.refresh(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retorna o usuário autenticado' })
  async me(@CurrentUser() payload: JwtPayload): Promise<AuthUser> {
    const user = await this.users.toAuthUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException({
        error: { code: 'USER_NOT_FOUND', message: 'Usuário não encontrado' },
      });
    }
    return user;
  }
}
