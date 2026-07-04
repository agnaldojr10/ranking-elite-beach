import { Module } from '@nestjs/common';
import { PlayersModule } from '../players/players.module';
import { RankingModule } from '../ranking/ranking.module';
import { StatsModule } from '../stats/stats.module';
import { MeController } from './me.controller';
import { MeService } from './me.service';

@Module({
  imports: [PlayersModule, StatsModule, RankingModule],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
