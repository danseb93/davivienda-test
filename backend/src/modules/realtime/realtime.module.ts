import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { PrismaRealtimeRepository } from './infrastructure/prisma/prisma-realtime.repository.js';
import { RealtimeController } from './realtime.controller.js';
import { RealtimeEventService } from './services/realtime-event.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [RealtimeController],
  providers: [
    RealtimeEventService,
    {
      provide: 'RealtimeRepository',
      useClass: PrismaRealtimeRepository,
    },
  ],
  exports: [RealtimeEventService],
})
export class RealtimeModule {}
