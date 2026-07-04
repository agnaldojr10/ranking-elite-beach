import { Module } from '@nestjs/common';
import { RankingModule } from '../ranking/ranking.module';
import { FinalsController } from './finals.controller';
import { FinalsService } from './finals.service';

@Module({
  imports: [RankingModule],
  controllers: [FinalsController],
  providers: [FinalsService],
})
export class FinalsModule {}
