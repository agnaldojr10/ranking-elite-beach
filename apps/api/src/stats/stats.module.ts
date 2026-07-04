import { Module } from '@nestjs/common';
import { RankingModule } from '../ranking/ranking.module';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [RankingModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
