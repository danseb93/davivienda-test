import { firstValueFrom } from 'rxjs';
import { RealtimeEventService } from './realtime-event.service.js';

describe('RealtimeEventService', () => {
  it('publishes status events for all documents to the shared stream', async () => {
    const service = new RealtimeEventService();
    const event = {
      id: 'ad0d232a-f65b-4aeb-b4a5-1bc188c1d097',
      title: 'Maintenance guide',
      status: 'INDEXED' as const,
      updatedAt: new Date(),
    };
    const received = firstValueFrom(service.streamDocuments());

    service.publish(event);

    await expect(received).resolves.toEqual({
      type: 'document.status',
      data: event,
    });
  });
});
