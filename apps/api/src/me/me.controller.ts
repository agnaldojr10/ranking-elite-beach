import { Controller, ForbiddenException, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type {
  JwtPayload,
  MeRanking,
  Player,
  PlayerMatch,
  PlayerStats,
} from '@reb/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { MeService } from './me.service';

/** Dados do próprio atleta (Portal do Jogador). Sempre escopado ao playerId do token. */
@ApiTags('me')
@ApiBearerAuth()
@Controller('me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLAYER')
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get('profile')
  profile(@CurrentUser() user: JwtPayload): Promise<Player> {
    return this.me.getProfile(user.clubId, this.playerId(user));
  }

  @Get('stats')
  stats(@CurrentUser() user: JwtPayload): Promise<PlayerStats> {
    return this.me.getStats(user.clubId, this.playerId(user));
  }

  @Get('ranking')
  ranking(@CurrentUser() user: JwtPayload): Promise<MeRanking> {
    return this.me.getRanking(user.clubId, this.playerId(user));
  }

  @Get('matches')
  matches(@CurrentUser() user: JwtPayload): Promise<PlayerMatch[]> {
    return this.me.getMatches(user.clubId, this.playerId(user));
  }

  @Get('next-match')
  nextMatch(@CurrentUser() user: JwtPayload): Promise<PlayerMatch | null> {
    return this.me.getNextMatch(user.clubId, this.playerId(user));
  }

  /** Garante que o usuário autenticado está vinculado a um atleta. */
  private playerId(user: JwtPayload): string {
    if (!user.playerId) {
      throw new ForbiddenException({
        error: { code: 'NOT_A_PLAYER', message: 'Conta sem vínculo de atleta' },
      });
    }
    return user.playerId;
  }
}
