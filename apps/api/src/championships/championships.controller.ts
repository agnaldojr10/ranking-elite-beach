import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CreateChampionshipSchema,
  UpdateChampionshipConfigSchema,
  UpdateChampionshipSchema,
  UpdateChampionshipStatusSchema,
  type Championship,
  type CreateChampionship,
  type JwtPayload,
  type UpdateChampionship,
  type UpdateChampionshipConfig,
  type UpdateChampionshipStatus,
} from '@reb/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ChampionshipsService } from './championships.service';

@ApiTags('championships')
@ApiBearerAuth()
@Controller('championships')
@UseGuards(JwtAuthGuard)
export class ChampionshipsController {
  constructor(private readonly championships: ChampionshipsService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('seasonId') seasonId?: string,
  ): Promise<Championship[]> {
    return this.championships.list(user.clubId, seasonId);
  }

  @Get(':id')
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<Championship> {
    return this.championships.get(user.clubId, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateChampionshipSchema)) dto: CreateChampionship,
  ): Promise<Championship> {
    return this.championships.create(user.clubId, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateChampionshipSchema)) dto: UpdateChampionship,
  ): Promise<Championship> {
    return this.championships.updateBasics(user.clubId, id, dto);
  }

  @Patch(':id/config')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  updateConfig(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateChampionshipConfigSchema)) dto: UpdateChampionshipConfig,
  ): Promise<Championship> {
    return this.championships.updateConfig(user.clubId, id, dto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  setStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateChampionshipStatusSchema)) dto: UpdateChampionshipStatus,
  ): Promise<Championship> {
    return this.championships.setStatus(user.clubId, id, dto.status);
  }
}
