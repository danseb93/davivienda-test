import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { DocumentRepository } from '../domain/document.repository.js';
import { Document } from '../domain/document.entity.js';

@Injectable()
export class DocumentFinderService {
  constructor(
    @Inject('DocumentRepository')
    private readonly documentRepository: DocumentRepository,
  ) {}

  findAll(): Promise<Document[]> {
    return this.documentRepository.findAll();
  }

  async findById(id: string): Promise<Document> {
    const document = await this.documentRepository.findById(id);
    if (!document) {
      throw new NotFoundException(`Document "${id}" not found`);
    }

    return document;
  }
}
