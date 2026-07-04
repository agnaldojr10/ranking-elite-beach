import { Module } from '@nestjs/common';
import { DrawService } from './draw.service';
import { HistoryService } from './history.service';
import { KnockoutService } from './knockout.service';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { RoundsController } from './rounds.controller';
import { RoundsService } from './rounds.service';

@Module({
  controllers: [RoundsController, RegistrationsController, MatchesController],
  providers: [
    RoundsService,
    RegistrationsService,
    DrawService,
    HistoryService,
    MatchesService,
    KnockoutService,
  ],
})
export class RoundsModule {}
