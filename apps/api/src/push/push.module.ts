import { Module } from '@nestjs/common';
import { PushController } from './push.controller';
import { PushScheduler } from './push.scheduler';
import { PushService } from './push.service';

@Module({
  controllers: [PushController],
  providers: [PushService, PushScheduler],
  exports: [PushService],
})
export class PushModule {}
