import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CreatePlayerSchema,
  PlayerQuerySchema,
  UpdatePlayerSchema,
  UpdatePlayerStatusSchema,
  type CreatePlayer,
  type InviteResponse,
  type JwtPayload,
  type PaginatedPlayers,
  type Player,
  type PlayerQuery,
  type UpdatePlayer,
  type UpdatePlayerStatus,
} from '@reb/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { InvitesService } from '../invites/invites.service';
import { PlayersService } from './players.service';

// Backoffice: fechado para o papel PLAYER (o atleta usa apenas /me/* no portal).
@ApiTags('players')
@ApiBearerAuth()
@Controller('players')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ORGANIZER', 'VIEWER')
export class PlayersController {
  constructor(
    private readonly players: PlayersService,
    private readonly invites: InvitesService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(PlayerQuerySchema)) query: PlayerQuery,
  ): Promise<PaginatedPlayers> {
    return this.players.list(user.clubId, query);
  }

  @Get(':id')
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<Player> {
    return this.players.get(user.clubId, id);
  }

  @Post()
  @Roles('ADMIN', 'ORGANIZER')
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreatePlayerSchema)) dto: CreatePlayer,
  ): Promise<Player> {
    return this.players.create(user.clubId, dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ORGANIZER')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePlayerSchema)) dto: UpdatePlayer,
  ): Promise<Player> {
    return this.players.update(user.clubId, id, dto);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'ORGANIZER')
  setStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePlayerStatusSchema)) dto: UpdatePlayerStatus,
  ): Promise<Player> {
    return this.players.setStatus(user.clubId, id, dto.status);
  }

  /** Gera um convite para o atleta reivindicar sua conta no Portal do Jogador. */
  @Post(':id/invite')
  @Roles('ADMIN', 'ORGANIZER')
  invite(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<InviteResponse> {
    return this.invites.generate(user.clubId, id, user.sub);
  }
}
