import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  RankingScopeSchema,
  type JwtPayload,
  type Ranking,
  type RankingEvolution,
} from '@reb/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RankingService } from './ranking.service';

@ApiTags('ranking')
@ApiBearerAuth()
@Controller('championships')
@UseGuards(JwtAuthGuard)
export class RankingController {
  constructor(private readonly ranking: RankingService) {}

  @Get(':id/ranking')
  get(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('scope') scope?: string,
  ): Promise<Ranking> {
    const parsed = RankingScopeSchema.catch('CHAMPIONSHIP').parse(scope);
    return this.ranking.getRanking(user.clubId, id, parsed);
  }

  @Get(':id/ranking/evolution')
  evolution(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<RankingEvolution> {
    return this.ranking.getEvolution(user.clubId, id);
  }
}
