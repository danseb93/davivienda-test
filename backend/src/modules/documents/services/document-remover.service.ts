import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { DocumentRepository } from '../domain/document.repository.js';
import { DocumentStorageService } from './document-storage.service.js';

@Injectable()
export class DocumentRemoverService {
  constructor(
    @Inject('DocumentRepository')
    private readonly documentRepository: DocumentRepository,
    private readonly documentStorage: DocumentStorageService,
  ) {}

  async remove(id: string): Promise<void> {
    const document = await this.documentRepository.findById(id);
    if (!document) {
      throw new NotFoundException(`Document "${id}" not found`);
    }

    await this.documentRepository.delete(id);
    await this.documentStorage.remove(document.storageName);
  }
}
