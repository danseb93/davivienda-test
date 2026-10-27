import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DocumentRepository } from '../domain/document.repository.js';
import { UpdateDocumentDto } from '../dto/document.dto.js';
import { Document } from '../domain/document.entity.js';

@Injectable()
export class DocumentUpdaterService {
  constructor(
    @Inject('DocumentRepository')
    private readonly documentRepository: DocumentRepository,
  ) {}

  async update(id: string, dto: UpdateDocumentDto): Promise<Document> {
    const existing = await this.documentRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Document "${id}" not found`);
    }

    const updates = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(updates).length === 0) {
      throw new BadRequestException(
        'At least one document field must be provided',
      );
    }

    return this.documentRepository.update(id, updates);
  }
}
