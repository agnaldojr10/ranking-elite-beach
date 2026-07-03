import { Module } from '@nestjs/common';
import { ChampionshipsController } from './championships.controller';
import { ChampionshipsService } from './championships.service';

@Module({
  controllers: [ChampionshipsController],
  providers: [ChampionshipsService],
})
export class ChampionshipsModule {}
