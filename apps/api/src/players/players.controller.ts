import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CreatePlayerSchema,
  PlayerQuerySchema,
  UpdatePlayerSchema,
  UpdatePlayerStatusSchema,
  type CreatePlayer,
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
import { PlayersService } from './players.service';

@ApiTags('players')
@ApiBearerAuth()
@Controller('players')
@UseGuards(JwtAuthGuard)
export class PlayersController {
  constructor(private readonly players: PlayersService) {}

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
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreatePlayerSchema)) dto: CreatePlayer,
  ): Promise<Player> {
    return this.players.create(user.clubId, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePlayerSchema)) dto: UpdatePlayer,
  ): Promise<Player> {
    return this.players.update(user.clubId, id, dto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  setStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePlayerStatusSchema)) dto: UpdatePlayerStatus,
  ): Promise<Player> {
    return this.players.setStatus(user.clubId, id, dto.status);
  }
}
