import { Module } from '@nestjs/common';
import { RealtimeController } from './realtime.controller.js';
import { RealtimeEventService } from './services/realtime-event.service.js';

@Module({
  controllers: [RealtimeController],
  providers: [RealtimeEventService],
  exports: [RealtimeEventService],
})
export class RealtimeModule {}
