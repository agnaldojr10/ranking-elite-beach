import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CreateSeasonSchema,
  UpdateSeasonStatusSchema,
  type CreateSeason,
  type JwtPayload,
  type Season,
  type UpdateSeasonStatus,
} from '@reb/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SeasonsService } from './seasons.service';

@ApiTags('seasons')
@ApiBearerAuth()
@Controller('seasons')
@UseGuards(JwtAuthGuard)
export class SeasonsController {
  constructor(private readonly seasons: SeasonsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload): Promise<Season[]> {
    return this.seasons.list(user.clubId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateSeasonSchema)) dto: CreateSeason,
  ): Promise<Season> {
    return this.seasons.create(user.clubId, dto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  setStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSeasonStatusSchema)) dto: UpdateSeasonStatus,
  ): Promise<Season> {
    return this.seasons.setStatus(user.clubId, id, dto.status);
  }
}
