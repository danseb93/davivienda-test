import { MessageEvent, NotFoundException } from '@nestjs/common';
import { firstValueFrom, take } from 'rxjs';
import { RealtimeEventService } from './services/realtime-event.service.js';
import { RealtimeController } from './realtime.controller.js';

describe('RealtimeController', () => {
  const documentId = 'ad0d232a-f65b-4aeb-b4a5-1bc188c1d097';

  it('sends the latest persisted document status when a client subscribes', async () => {
    const updatedAt = new Date();
    const repository = {
      findDocumentStatus: vi.fn().mockResolvedValue({
          id: documentId,
          status: 'INDEXED',
          updatedAt,
        }),
    };
    const controller = new RealtimeController(
      new RealtimeEventService(repository),
    );

    await expect(
      firstValueFrom(controller.streamDocument(documentId).pipe(take(1))),
    ).resolves.toEqual({
      type: 'document.status',
      data: { id: documentId, status: 'INDEXED', updatedAt },
    });
  });

  it('reports an unknown document when the SSE stream is opened', async () => {
    const repository = {
      findDocumentStatus: vi.fn().mockResolvedValue(null),
    };
    const controller = new RealtimeController(
      new RealtimeEventService(repository),
    );

    await expect(
      firstValueFrom(controller.streamDocument(documentId).pipe(take(1))),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('streams subsequent processing status updates', async () => {
    const updatedAt = new Date();
    const repository = {
      findDocumentStatus: vi.fn().mockResolvedValue({
          id: documentId,
          status: 'PROCESSING',
          updatedAt,
        }),
    };
    const realtimeEvents = new RealtimeEventService(repository);
    const controller = new RealtimeController(realtimeEvents);
    const received: MessageEvent[] = [];
    let receiveInitial!: () => void;
    const initialReceived = new Promise<void>((resolve) => {
      receiveInitial = resolve;
    });
    let finish!: () => void;
    const completed = new Promise<void>((resolve) => {
      finish = resolve;
    });

    controller
      .streamDocument(documentId)
      .pipe(take(2))
      .subscribe((event) => {
        received.push(event);
        if (received.length === 1) {
          receiveInitial();
        } else {
          finish();
        }
      });

    await initialReceived;
    realtimeEvents.publish({
      id: documentId,
      status: 'INDEXED',
      updatedAt: new Date(),
    });
    await completed;

    expect(
      received.map((event) => (event.data as { status: string }).status),
    ).toEqual(['PROCESSING', 'INDEXED']);
  });
});
