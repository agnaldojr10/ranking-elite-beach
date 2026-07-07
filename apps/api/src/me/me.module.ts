import { Module } from '@nestjs/common';
import { PlayersModule } from '../players/players.module';
import { RankingModule } from '../ranking/ranking.module';
import { RoundsModule } from '../rounds/rounds.module';
import { StatsModule } from '../stats/stats.module';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { PortalRoundsController } from './portal-rounds.controller';
import { PortalRoundsService } from './portal-rounds.service';

@Module({
  imports: [PlayersModule, StatsModule, RankingModule, RoundsModule],
  controllers: [MeController, PortalRoundsController],
  providers: [MeService, PortalRoundsService],
})
export class MeModule {}
