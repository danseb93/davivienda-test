import { PrismaService } from '../../../../prisma/prisma.service.js';
import { Document } from '../../domain/document.entity.js';
import { PrismaDocumentRepository } from './prisma-document.repository.js';

interface TransactionMock {
  $queryRaw: ReturnType<typeof vi.fn>;
  document: {
    findUniqueOrThrow: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
}

function createPrisma(transaction: TransactionMock): PrismaService {
  return {
    $transaction: vi.fn(
      (callback: (transaction: TransactionMock) => Promise<unknown>) =>
        callback(transaction),
    ),
  } as unknown as PrismaService;
}

describe('PrismaDocumentRepository processing queue', () => {
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

  it('claims a pending document and commits its extracted content as indexed', async () => {
    const updatedAt = new Date();
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: document.id }]),
      document: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(document),
        update: vi.fn().mockResolvedValue({
          id: document.id,
          title: document.title,
          author: document.author,
          category: document.category,
          tags: document.tags,
          version: document.version,
          content: 'Extracted content',
          fileName: document.fileName,
          storageName: document.storageName,
          mimeType: document.mimeType,
          fileSize: document.fileSize,
          status: 'INDEXED',
          updatedAt,
        }),
      },
    };
    const repository = new PrismaDocumentRepository(createPrisma(transaction));

    await expect(
      repository.processNextPending(async () => 'Extracted content'),
    ).resolves.toEqual({
      id: document.id,
      status: 'INDEXED',
      updatedAt,
    });
    expect(transaction.document.update).toHaveBeenCalledWith({
      where: { id: document.id },
      data: { content: 'Extracted content', status: 'INDEXED' },
    });
  });

  it('marks an unprocessable document as error', async () => {
    const updatedAt = new Date();
    const extractionError = new Error('Unsupported file content');
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: document.id }]),
      document: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(document),
        update: vi.fn().mockResolvedValue({
          id: document.id,
          title: document.title,
          author: document.author,
          category: document.category,
          tags: document.tags,
          version: document.version,
          content: document.content,
          fileName: document.fileName,
          storageName: document.storageName,
          mimeType: document.mimeType,
          fileSize: document.fileSize,
          status: 'ERROR',
          updatedAt,
        }),
      },
    };
    const repository = new PrismaDocumentRepository(createPrisma(transaction));

    await expect(
      repository.processNextPending(async () => {
        throw extractionError;
      }),
    ).resolves.toEqual({
      id: document.id,
      status: 'ERROR',
      updatedAt,
      error: extractionError,
    });
    expect(transaction.document.update).toHaveBeenCalledWith({
      where: { id: document.id },
      data: { status: 'ERROR' },
    });
  });

  it('returns no result when the queue has no pending documents', async () => {
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      document: {
        findUniqueOrThrow: vi.fn(),
        update: vi.fn(),
      },
    };
    const repository = new PrismaDocumentRepository(createPrisma(transaction));

    await expect(repository.processNextPending(vi.fn())).resolves.toBeNull();
    expect(transaction.document.findUniqueOrThrow).not.toHaveBeenCalled();
  });
});
