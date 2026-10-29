import {
  Inject,
  Injectable,
  MessageEvent,
  NotFoundException,
} from '@nestjs/common';
import { Observable, Subject, defer, filter, interval, map, merge } from 'rxjs';
import { DocumentStatusEvent } from '../domain/document-status-event.js';
import type { RealtimeRepository } from '../domain/realtime.repository.js';

@Injectable()
export class RealtimeEventService {
  private readonly events = new Subject<DocumentStatusEvent>();

  constructor(
    @Inject('RealtimeRepository')
    private readonly realtimeRepository: RealtimeRepository,
  ) {}

  publish(event: DocumentStatusEvent): void {
    this.events.next(event);
  }

  observeDocument(id: string): Observable<DocumentStatusEvent> {
    return this.events.pipe(filter((event) => event.id === id));
  }

  streamDocuments(): Observable<MessageEvent> {
    const updates = this.events.pipe(
      map((data) => ({ type: 'document.status', data })),
    );
    const heartbeat = interval(15_000).pipe(
      map(() => ({ type: 'heartbeat', data: '' })),
    );

    return merge(updates, heartbeat);
  }

  streamDocument(id: string): Observable<MessageEvent> {
    const currentStatus = defer(async () => {
      const document = await this.realtimeRepository.findDocumentStatus(id);
      if (!document) {
        throw new NotFoundException(`Document "${id}" not found`);
      }
      return document;
    }).pipe(map((data) => ({ type: 'document.status', data })));

    const updates = this.observeDocument(id).pipe(
      map((data) => ({ type: 'document.status', data })),
    );
    const heartbeat = interval(15_000).pipe(
      map(() => ({ type: 'heartbeat', data: '' })),
    );

    return merge(updates, currentStatus, heartbeat);
  }
}
