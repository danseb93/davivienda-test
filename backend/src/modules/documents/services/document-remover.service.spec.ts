import { NotFoundException } from '@nestjs/common';
import type { DocumentRepository } from '../domain/document.repository.js';
import type { Document } from '../domain/document.entity.js';
import { DocumentRemoverService } from './document-remover.service.js';
import type { DocumentStorageService } from './document-storage.service.js';

describe('DocumentRemoverService', () => {
  const document: Document = {
    id: 'ad0d232a-f65b-4aeb-b4a5-1bc188c1d097',
    title: 'Maintenance guide',
    author: 'Engineering',
    category: 'Manuals',
    tags: ['engine'],
    version: '1.0',
    content: 'Document contents',
    fileName: 'manual.pdf',
    storageName: 'stored-file.pdf',
    mimeType: 'application/pdf',
    fileSize: 5,
    status: 'INDEXED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('deletes the document and its stored file', async () => {
    const calls: string[] = [];
    const findById = vi.fn().mockResolvedValue(document);
    const deleteDocument = vi.fn(async () => {
      calls.push('delete');
      return document;
    });
    const removeFile = vi.fn(async () => {
      calls.push('removeFile');
    });
    const repository = {
      findById,
      delete: deleteDocument,
    } as unknown as DocumentRepository;
    const storage = {
      remove: removeFile,
    } as DocumentStorageService;
    const service = new DocumentRemoverService(repository, storage);

    await expect(service.remove(document.id)).resolves.toBeUndefined();

    expect(findById).toHaveBeenCalledWith(document.id);
    expect(deleteDocument).toHaveBeenCalledWith(document.id);
    expect(removeFile).toHaveBeenCalledWith(document.storageName);
    expect(calls).toEqual(['delete', 'removeFile']);
  });

  it('does not delete anything when the document is missing', async () => {
    const findById = vi.fn().mockResolvedValue(null);
    const deleteDocument = vi.fn();
    const removeFile = vi.fn();
    const repository = {
      findById,
      delete: deleteDocument,
    } as unknown as DocumentRepository;
    const storage = {
      remove: removeFile,
    } as DocumentStorageService;
    const service = new DocumentRemoverService(repository, storage);

    await expect(service.remove(document.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(findById).toHaveBeenCalledWith(document.id);
    expect(deleteDocument).not.toHaveBeenCalled();
    expect(removeFile).not.toHaveBeenCalled();
  });
});
