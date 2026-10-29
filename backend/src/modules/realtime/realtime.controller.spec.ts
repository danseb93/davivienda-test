import { firstValueFrom, take } from 'rxjs';
import { RealtimeEventService } from './services/realtime-event.service.js';
import { RealtimeController } from './realtime.controller.js';

describe('RealtimeController', () => {
  it('streams status updates for all documents over one connection', async () => {
    const realtimeEvents = new RealtimeEventService();
    const controller = new RealtimeController(realtimeEvents);
    const documentId = 'ad0d232a-f65b-4aeb-b4a5-1bc188c1d097';
    const updatedAt = new Date();
    const received = firstValueFrom(
      controller.streamDocuments().pipe(take(1)),
    );

    realtimeEvents.publish({
      id: documentId,
      title: 'Maintenance guide',
      status: 'INDEXED',
      updatedAt,
    });

    await expect(received).resolves.toEqual({
      type: 'document.status',
      data: { id: documentId, title: 'Maintenance guide', status: 'INDEXED', updatedAt },
    });
  });
});
