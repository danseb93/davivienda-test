import { Inject, Injectable } from '@nestjs/common';
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
}
