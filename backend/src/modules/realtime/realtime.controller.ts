import {
  Controller,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Sse,
} from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { RealtimeEventService } from './services/realtime-event.service.js';

@ApiTags('Realtime')
@Controller('realtime')
export class RealtimeController {
  constructor(
    private readonly realtimeEvents: RealtimeEventService,
  ) {}

  @Sse('documents')
  @ApiOperation({
    summary: 'Subscribe to processing status updates for all documents',
  })
  @ApiProduces('text/event-stream')
  streamDocuments(): Observable<MessageEvent> {
    return this.realtimeEvents.streamDocuments();
  }

  @Sse('documents/:id')
  @ApiOperation({
    summary: 'Subscribe to document processing status updates',
  })
  @ApiProduces('text/event-stream')
  streamDocument(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Observable<MessageEvent> {
    return this.realtimeEvents.streamDocument(id);
  }
}
