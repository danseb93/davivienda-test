import { DocumentRepository } from '../domain/document.repository.js';
import { RealtimeEventService } from '../../realtime/services/realtime-event.service.js';
import { DocumentIndexingService } from './document-indexing.service.js';
import { Document } from '../domain/document.entity.js';

describe('DocumentIndexingService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('extracts pending files and publishes the committed status', async () => {
    vi.useFakeTimers();
    const document: Document = {
      id: 'ad0d232a-f65b-4aeb-b4a5-1bc188c1d097',
      title: 'Maintenance guide',
      author: 'Engineering',
      category: 'Manuals',
      tags: ['engine'],
      version: '1.0',
      content: '',
      fileName: 'manual.txt',
      storageName: 'stored-file.txt',
      mimeType: 'text/plain',
      fileSize: 24,
      status: 'PROCESSING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    let processed = false;
    const processNextPending = vi.fn(
      async (extractContent: (document: Document) => Promise<string>) => {
        if (processed) {
          return null;
        }
        processed = true;
        expect(await extractContent(document)).toBe('Document contents');
        return {
          id: document.id,
          status: 'INDEXED' as const,
          updatedAt: new Date(),
        };
      },
    );
    const repository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      processNextPending,
    } satisfies DocumentRepository;
    const storage = {
      read: vi.fn().mockResolvedValue(Buffer.from('Document contents')),
    };
    const extractor = {
      extract: vi.fn().mockResolvedValue('Document contents'),
    };
    const realtimeEvents = new RealtimeEventService();
    const publish = vi.spyOn(realtimeEvents, 'publish');
    const service = new DocumentIndexingService(
      repository,
      storage,
      extractor,
      realtimeEvents,
    );

    service.onModuleInit();
    await vi.advanceTimersByTimeAsync(0);

    expect(storage.read).toHaveBeenCalledWith('stored-file.txt');
    expect(extractor.extract).toHaveBeenCalledWith(
      Buffer.from('Document contents'),
      'text/plain',
    );
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ id: document.id, status: 'INDEXED' }),
    );

    await service.onModuleDestroy();
  });
});
