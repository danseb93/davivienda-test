import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject, interval, map, merge } from 'rxjs';
import { DocumentStatusEvent } from '../domain/document-status-event.js';

@Injectable()
export class RealtimeEventService {
  private readonly events = new Subject<DocumentStatusEvent>();

  publish(event: DocumentStatusEvent): void {
    this.events.next(event);
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
}
