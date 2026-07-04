import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { DashboardSummary, JwtPayload, PlayerStats } from '@reb/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { StatsService } from './stats.service';

// Backoffice: fechado para o papel PLAYER (o atleta usa /me/stats no portal).
@ApiTags('stats')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ORGANIZER', 'VIEWER')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('players/:id/stats')
  playerStats(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<PlayerStats> {
    return this.stats.getPlayerStats(user.clubId, id);
  }

  @Get('dashboard')
  dashboard(@CurrentUser() user: JwtPayload): Promise<DashboardSummary> {
    return this.stats.getDashboard(user.clubId);
  }
}
