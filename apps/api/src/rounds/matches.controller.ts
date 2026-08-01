import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  RegisterMatchResultSchema,
  ScheduleMatchSchema,
  type GroupStandings,
  type JwtPayload,
  type KnockoutView,
  type MatchView,
  type RegisterMatchResult,
  type RoundResultView,
  type ScheduleMatch,
} from '@reb/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { KnockoutService } from './knockout.service';
import { MatchesService } from './matches.service';

// Backoffice: fechado para o papel PLAYER (o atleta usa /me/matches no portal).
@ApiTags('matches')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ORGANIZER', 'VIEWER')
export class MatchesController {
  constructor(
    private readonly matches: MatchesService,
    private readonly knockout: KnockoutService,
  ) {}

  @Get('rounds/:id/matches')
  list(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<MatchView[]> {
    return this.matches.getMatches(user.clubId, id);
  }

  @Get('rounds/:id/standings')
  standings(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<GroupStandings[]> {
    return this.matches.getStandings(user.clubId, id);
  }

  @Patch('matches/:id/result')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  registerResult(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RegisterMatchResultSchema)) dto: RegisterMatchResult,
  ): Promise<MatchView> {
    return this.matches.registerResult(user.clubId, id, user.sub, dto);
  }

  @Patch('matches/:id/schedule')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  schedule(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ScheduleMatchSchema)) dto: ScheduleMatch,
  ): Promise<MatchView> {
    return this.matches.scheduleMatch(user.clubId, id, {
      venueId: dto.venueId,
      scheduledAt: dto.scheduledAt === '' ? null : dto.scheduledAt,
    });
  }

  @Get('rounds/:id/knockout')
  getKnockout(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<KnockoutView> {
    return this.knockout.getKnockout(user.clubId, id);
  }

  @Post('rounds/:id/knockout/generate')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  generateKnockout(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<KnockoutView> {
    return this.knockout.generate(user.clubId, id);
  }

  @Delete('rounds/:id/knockout')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
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
}
