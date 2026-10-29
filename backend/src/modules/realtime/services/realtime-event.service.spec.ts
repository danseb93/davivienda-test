import { RealtimeEventService } from './realtime-event.service.js';

describe('RealtimeEventService', () => {
  it('publishes status events only to subscribers for the matching document', async () => {
    const service = new RealtimeEventService({
      findDocumentStatus: vi.fn(),
    });
    const event = {
      id: 'ad0d232a-f65b-4aeb-b4a5-1bc188c1d097',
      title: 'Maintenance guide',
      status: 'INDEXED' as const,
      updatedAt: new Date(),
    };
    const received = new Promise((resolve) => {
      service.observeDocument(event.id).subscribe(resolve);
    });

    service.publish({ ...event, id: 'bc0d232a-f65b-4aeb-b4a5-1bc188c1d097' });
    service.publish(event);

    await expect(received).resolves.toEqual(event);
  });
});
