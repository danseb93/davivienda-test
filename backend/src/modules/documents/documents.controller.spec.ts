import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { DocumentsController } from './documents.controller.js';
import { Document } from './domain/document.entity.js';
import { DocumentCreatorService } from './services/document-creator.service.js';
import { DocumentFinderService } from './services/document-finder.service.js';
import { DocumentRemoverService } from './services/document-remover.service.js';
import { DocumentStorageService } from './services/document-storage.service.js';
import { DocumentUpdaterService } from './services/document-updater.service.js';

describe('DocumentsController original file preview', () => {
  it('streams the stored original with its safe inline filename and content type', async () => {
    const document: Document = {
      id: 'ad0d232a-f65b-4aeb-b4a5-1bc188c1d097',
      title: 'Guide',
      author: 'Team',
      category: 'Manuals',
      tags: [],
      version: '1.0',
      content: '',
      fileName: 'guide (final).pdf',
      storageName: 'stored-file.pdf',
      mimeType: 'application/pdf',
      fileSize: 10,
      status: 'INDEXED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const file = Buffer.from('%PDF-1.7');
    const findById = vi.fn().mockResolvedValue(document);
    const read = vi.fn().mockResolvedValue(file);
    const readPreview = vi.fn().mockResolvedValue(file);
    const setHeader = vi.fn();
    const controller = new DocumentsController(
      { findAll: vi.fn(), findById } as DocumentFinderService,
      { create: vi.fn() } as unknown as DocumentCreatorService,
      { update: vi.fn() } as unknown as DocumentUpdaterService,
      { remove: vi.fn() } as unknown as DocumentRemoverService,
      { read, readPreview, store: vi.fn(), remove: vi.fn() } as DocumentStorageService,
    );

    const result = await controller.getOriginalFile(
      document.id,
      { setHeader } as unknown as Response,
    );

    expect(result).toBeInstanceOf(StreamableFile);
    expect(findById).toHaveBeenCalledWith(document.id);
    expect(read).toHaveBeenCalledWith(document.storageName);
    expect(setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      "inline; filename*=UTF-8''guide%20%28final%29.pdf",
    );
    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store');
  });

  it('streams the searchable preview through the preview endpoint', async () => {
    const document = {
      id: 'ad0d232a-f65b-4aeb-b4a5-1bc188c1d097',
      fileName: 'manual.pdf',
      storageName: 'stored-file.pdf',
      mimeType: 'application/pdf',
    } as Document;
    const file = Buffer.from('%PDF-1.7');
    const readPreview = vi.fn().mockResolvedValue(file);
    const setHeader = vi.fn();
    const controller = new DocumentsController(
      { findById: vi.fn().mockResolvedValue(document) } as DocumentFinderService,
      {} as DocumentCreatorService,
      {} as DocumentUpdaterService,
      {} as DocumentRemoverService,
      { readPreview } as unknown as DocumentStorageService,
    );

    const result = await controller.getPreviewFile(
      document.id,
      { setHeader } as unknown as Response,
    );

    expect(result).toBeInstanceOf(StreamableFile);
    expect(readPreview).toHaveBeenCalledWith(document.storageName);
    expect(setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
  });
});

describe('DocumentsController document counts', () => {
  it('returns status counts in the standard response wrapper', async () => {
    const counts = { total: 25, indexed: 20, processing: 3, error: 2 };
    const findCounts = vi.fn().mockResolvedValue(counts);
    const controller = new DocumentsController(
      { findCounts } as unknown as DocumentFinderService,
      {} as DocumentCreatorService,
      {} as DocumentUpdaterService,
      {} as DocumentRemoverService,
      {} as DocumentStorageService,
    );

    await expect(controller.findCounts({ search: 'manual' })).resolves.toEqual({
      statusCode: 200,
      success: true,
      message: 'Document counts retrieved successfully',
      data: counts,
    });
    expect(findCounts).toHaveBeenCalledWith('manual');
  });
});
