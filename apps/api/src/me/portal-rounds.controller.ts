import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  BulkCreateRegistrationSchema,
  ConfirmDrawSchema,
  QuickAddPlayerSchema,
  RegisterMatchResultSchema,
  SimulateDrawSchema,
  type BulkCreateRegistration,
  type ConfirmDraw,
  type ConfirmedDraw,
  type DrawResult,
  type GroupStandings,
  type JwtPayload,
  type KnockoutView,
  type MatchView,
  type Player,
  type QuickAddPlayer,
  type RegisterMatchResult,
  type Round,
  type RoundReport,
  type RoundResultView,
  type SimulateDraw,
} from '@reb/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DrawService } from '../rounds/draw.service';
import { KnockoutService } from '../rounds/knockout.service';
import { MatchesService } from '../rounds/matches.service';
import { RegistrationsService } from '../rounds/registrations.service';
import { RoundsService } from '../rounds/rounds.service';
import { PortalRoundsService } from './portal-rounds.service';

/**
 * Portal do Jogador — OPERAR a rodada. Qualquer atleta do clube (PLAYER) pode
 * sortear, lançar resultados e gerar o mata-mata; reusa os serviços do backoffice,
 * escopados por clubId do token. Não expõe descartar sorteio / mudar status
 * (essas ações continuam só no backoffice).
 */
@ApiTags('me')
@ApiBearerAuth()
@Controller('me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLAYER', 'ADMIN', 'ORGANIZER')
export class PortalRoundsController {
  constructor(
    private readonly portal: PortalRoundsService,
    private readonly rounds: RoundsService,
    private readonly registrations: RegistrationsService,
    private readonly draw: DrawService,
    private readonly matches: MatchesService,
    private readonly knockout: KnockoutService,
  ) {}

  @Get('rounds')
  list(@CurrentUser() user: JwtPayload): Promise<Round[]> {
    return this.portal.listRounds(user.clubId);
  }

  @Get('rounds/:id')
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<Round> {
    return this.rounds.get(user.clubId, id);
  }

  @Get('rounds/:id/eligible-players')
  eligiblePlayers(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<{ id: string; name: string; skillLevel: string }[]> {
    return this.portal.eligiblePlayers(user.clubId, id);
  }

  @Post('rounds/:id/players')
  quickAddPlayer(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(QuickAddPlayerSchema)) dto: QuickAddPlayer,
  ): Promise<Player> {
    return this.portal.quickAddPlayer(user.clubId, id, dto);
  }

  @Post('rounds/:id/registrations/bulk')
  registerBulk(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(BulkCreateRegistrationSchema)) dto: BulkCreateRegistration,
  ): Promise<{ added: number }> {
    return this.registrations.createMany(user.clubId, id, dto);
  }

  @Post('rounds/:id/draw/simulate')
  simulate(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SimulateDrawSchema)) dto: SimulateDraw,
  ): Promise<DrawResult> {
    return this.draw.simulate(user.clubId, id, dto);
  }

  @Post('rounds/:id/draw/confirm')
  confirm(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ConfirmDrawSchema)) dto: ConfirmDraw,
  ): Promise<ConfirmedDraw> {
    return this.draw.confirm(user.clubId, id, user.sub, dto);
  }

  @Get('rounds/:id/draw')
  getDraw(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<ConfirmedDraw> {
    return this.draw.getConfirmed(user.clubId, id);
  }

  @Get('rounds/:id/matches')
  matchList(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<MatchView[]> {
    return this.matches.getMatches(user.clubId, id);
  }

  @Get('rounds/:id/standings')
  standings(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<GroupStandings[]> {
    return this.matches.getStandings(user.clubId, id);
  }

  @Patch('matches/:id/result')
  registerResult(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RegisterMatchResultSchema)) dto: RegisterMatchResult,
  ): Promise<MatchView> {
    return this.matches.registerResult(user.clubId, id, user.sub, dto);
  }

  @Get('rounds/:id/knockout')
  getKnockout(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<KnockoutView> {
    return this.knockout.getKnockout(user.clubId, id);
  }

  @Post('rounds/:id/knockout/generate')
  generateKnockout(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<KnockoutView> {
    return this.knockout.generate(user.clubId, id);
  }

  @Delete('rounds/:id/knockout')
  revertKnockout(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<KnockoutView> {
    return this.knockout.revert(user.clubId, id);
  }

  @Get('rounds/:id/result')
  result(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<RoundResultView[]> {
    return this.knockout.getResult(user.clubId, id);
  }

  @Get('rounds/:id/report')
  report(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<RoundReport> {
    return this.portal.report(user.clubId, id);
  }

  @Get('rounds/:id/draw-report')
  drawReport(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<RoundReport> {
    return this.portal.drawReport(user.clubId, id);
  }
}
