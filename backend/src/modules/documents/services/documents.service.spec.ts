import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DocumentRepository } from '../domain/document.repository.js';
import { CreateDocumentDto, UpdateDocumentDto } from '../dto/document.dto.js';
import { DocumentCreatorService } from './document-creator.service.js';
import { DocumentFinderService } from './document-finder.service.js';
import { DocumentUpdaterService } from './document-updater.service.js';

describe('document services', () => {
  const document = {
    id: 'ad0d232a-f65b-4aeb-b4a5-1bc188c1d097',
    title: 'Maintenance guide',
    author: 'Engineering',
    category: 'Manuals',
    tags: ['engine'],
    version: '1.0',
    fileName: 'manual.pdf',
    storageName: 'stored-file.pdf',
    mimeType: 'application/pdf',
    fileSize: 5,
    status: 'PROCESSING' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('creates a document and marks it as processing', async () => {
    const create = vi.fn().mockResolvedValue(document);
    const repository: DocumentRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create,
      update: vi.fn(),
      delete: vi.fn(),
      processNextPending: vi.fn(),
    };
    const storage = {
      store: vi.fn().mockResolvedValue('stored-file.pdf'),
      remove: vi.fn(),
    };
    const service = new DocumentCreatorService(repository, storage);
    const dto = {
      title: 'Maintenance guide',
      author: 'Engineering',
      category: 'Manuals',
      tags: ['engine'],
      version: '1.0',
    } as CreateDocumentDto;
    const file = {
      originalname: 'manual.pdf',
      mimetype: 'application/pdf',
      size: 5,
      buffer: Buffer.from('%PDF-'),
    } as Express.Multer.File;

    await expect(service.create(dto, file)).resolves.toEqual(document);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'manual.pdf',
        storageName: 'stored-file.pdf',
        status: 'PROCESSING',
      }),
    );
  });

  it('requires a file for document creation', async () => {
    const repository: DocumentRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      processNextPending: vi.fn(),
    };
    const storage = { store: vi.fn(), remove: vi.fn() };
    const service = new DocumentCreatorService(repository, storage);

    await expect(
      service.create({} as CreateDocumentDto),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.store).not.toHaveBeenCalled();
  });

  it('rejects empty metadata updates', async () => {
    const repository: DocumentRepository = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(document),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      processNextPending: vi.fn(),
    };
    const service = new DocumentUpdaterService(repository);

    await expect(
      service.update(document.id, {} as UpdateDocumentDto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns not found when updating a missing document', async () => {
    const repository: DocumentRepository = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      processNextPending: vi.fn(),
    };
    const service = new DocumentUpdaterService(repository);

    await expect(
      service.update(document.id, { title: 'New title' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('finds a document by ID', async () => {
    const findById = vi.fn().mockResolvedValue(document);
    const repository: DocumentRepository = {
      findAll: vi.fn(),
      findById,
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      processNextPending: vi.fn(),
    };
    const service = new DocumentFinderService(repository);

    await expect(service.findById(document.id)).resolves.toEqual(document);
    expect(findById).toHaveBeenCalledWith(document.id);
  });

  it('returns not found when looking up a missing document', async () => {
    const repository: DocumentRepository = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      processNextPending: vi.fn(),
    };
    const service = new DocumentFinderService(repository);

    await expect(service.findById(document.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
