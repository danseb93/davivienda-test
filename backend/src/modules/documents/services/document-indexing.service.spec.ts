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
      fileName: 'manual.pdf',
      storageName: 'stored-file.pdf',
      mimeType: 'application/pdf',
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
          title: document.title,
          status: 'INDEXED' as const,
          updatedAt: new Date(),
        };
      },
    );
    const repository = {
      findAll: vi.fn(),
      findCounts: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      processNextPending,
    } satisfies DocumentRepository;
    const storage = {
      read: vi.fn().mockResolvedValue(Buffer.from('%PDF-original')),
      storeSearchablePdf: vi.fn(),
    };
    const searchableBuffer = Buffer.from('%PDF-searchable');
    const extractor = {
      extract: vi.fn().mockResolvedValue('Document contents'),
    };
    const searchablePdf = {
      makeSearchable: vi.fn().mockResolvedValue(searchableBuffer),
    };
    const realtimeEvents = new RealtimeEventService();
    const publish = vi.spyOn(realtimeEvents, 'publish');
    const service = new DocumentIndexingService(
      repository,
      storage,
      extractor,
      searchablePdf,
      realtimeEvents,
    );

    service.onModuleInit();
    await vi.advanceTimersByTimeAsync(0);

    expect(storage.read).toHaveBeenCalledWith('stored-file.pdf');
    expect(searchablePdf.makeSearchable).toHaveBeenCalledWith(
      Buffer.from('%PDF-original'),
    );
    expect(storage.storeSearchablePdf).toHaveBeenCalledWith(
      'stored-file.pdf',
      searchableBuffer,
    );
    expect(extractor.extract).toHaveBeenCalledWith(
      searchableBuffer,
      'application/pdf',
    );
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ id: document.id, status: 'INDEXED' }),
    );

    await service.onModuleDestroy();
  });
});
