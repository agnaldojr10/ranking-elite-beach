import { Controller, ForbiddenException, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type {
  JwtPayload,
  MeAchievement,
  MeH2H,
  MeOpponentSummary,
  MeRanking,
  MeTournamentDetail,
  MeTournamentSummary,
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

  @Get('tournaments')
  tournaments(@CurrentUser() user: JwtPayload): Promise<MeTournamentSummary[]> {
    return this.me.getTournaments(user.clubId, this.playerId(user));
  }

  @Get('tournaments/:championshipId')
  tournament(
    @CurrentUser() user: JwtPayload,
    @Param('championshipId') championshipId: string,
  ): Promise<MeTournamentDetail> {
    return this.me.getTournament(user.clubId, this.playerId(user), championshipId);
  }

  @Get('opponents')
  opponents(@CurrentUser() user: JwtPayload): Promise<MeOpponentSummary[]> {
    return this.me.getOpponents(user.clubId, this.playerId(user));
  }

  @Get('h2h/:opponentId')
  h2h(
    @CurrentUser() user: JwtPayload,
    @Param('opponentId') opponentId: string,
  ): Promise<MeH2H> {
    return this.me.getH2H(user.clubId, this.playerId(user), opponentId);
  }

  @Get('achievements')
  achievements(@CurrentUser() user: JwtPayload): Promise<MeAchievement[]> {
    return this.me.getAchievements(user.clubId, this.playerId(user));
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
