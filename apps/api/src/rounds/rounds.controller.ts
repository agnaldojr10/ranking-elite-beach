import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ConfirmDrawSchema,
  CreateRegistrationSchema,
  CreateRoundSchema,
  SimulateDrawSchema,
  UpdateRoundSchema,
  UpdateRoundStatusSchema,
  type ConfirmDraw,
  type ConfirmedDraw,
  type CreateRegistration,
  type CreateRound,
  type DrawResult,
  type JwtPayload,
  type Registration,
  type Round,
  type SimulateDraw,
  type UpdateRound,
  type UpdateRoundStatus,
} from '@reb/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DrawService } from './draw.service';
import { RegistrationsService } from './registrations.service';
import { RoundsService } from './rounds.service';

// Backoffice: fechado para o papel PLAYER (o atleta usa /me/* no portal).
@ApiTags('rounds')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ORGANIZER', 'VIEWER')
export class RoundsController {
  constructor(
    private readonly rounds: RoundsService,
    private readonly registrations: RegistrationsService,
    private readonly draw: DrawService,
  ) {}

  @Get('championships/:championshipId/rounds')
  list(
    @CurrentUser() user: JwtPayload,
    @Param('championshipId') championshipId: string,
  ): Promise<Round[]> {
    return this.rounds.list(user.clubId, championshipId);
  }

  @Post('championships/:championshipId/rounds')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  create(
    @CurrentUser() user: JwtPayload,
    @Param('championshipId') championshipId: string,
    @Body(new ZodValidationPipe(CreateRoundSchema)) dto: CreateRound,
  ): Promise<Round> {
    return this.rounds.create(user.clubId, championshipId, dto);
  }

  @Get('rounds/:id')
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<Round> {
    return this.rounds.get(user.clubId, id);
  }

  @Patch('rounds/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateRoundSchema)) dto: UpdateRound,
  ): Promise<Round> {
    return this.rounds.updateBasics(user.clubId, id, dto);
  }

  @Patch('rounds/:id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  setStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateRoundStatusSchema)) dto: UpdateRoundStatus,
  ): Promise<Round> {
    return this.rounds.setStatus(user.clubId, id, dto.status);
  }

  @Post('rounds/:id/registrations')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  register(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateRegistrationSchema)) dto: CreateRegistration,
  ): Promise<Registration> {
    return this.registrations.create(user.clubId, id, dto);
  }

  @Post('rounds/:id/draw/simulate')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  simulate(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SimulateDrawSchema)) dto: SimulateDraw,
  ): Promise<DrawResult> {
    return this.draw.simulate(user.clubId, id, dto);
  }

  @Post('rounds/:id/draw/confirm')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
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

  @Delete('rounds/:id/draw')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  discardDraw(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<{ ok: true }> {
    return this.draw.discard(user.clubId, id);
  }
}
