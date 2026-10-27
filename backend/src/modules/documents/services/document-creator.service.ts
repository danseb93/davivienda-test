import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { DocumentRepository } from '../domain/document.repository.js';
import { CreateDocumentDto } from '../dto/document.dto.js';
import { Document } from '../domain/document.entity.js';
import { DocumentStorageService } from './document-storage.service.js';

@Injectable()
export class DocumentCreatorService {
  private readonly logger = new Logger(DocumentCreatorService.name);

  constructor(
    @Inject('DocumentRepository')
    private readonly documentRepository: DocumentRepository,
    private readonly documentStorage: DocumentStorageService,
  ) {}

  async create(
    dto: CreateDocumentDto,
    file?: Express.Multer.File,
  ): Promise<Document> {
    if (!file) {
      throw new BadRequestException('A document file is required');
    }

    const storageName = await this.documentStorage.store(file);

    try {
      return await this.documentRepository.create({
        title: dto.title,
        author: dto.author,
        category: dto.category,
        tags: dto.tags ?? [],
        version: dto.version,
        fileName: file.originalname,
        storageName,
        mimeType: file.mimetype,
        fileSize: file.size,
        status: 'PROCESSING',
      });
    } catch (error) {
      try {
        await this.documentStorage.remove(storageName);
      } catch (cleanupError) {
        this.logger.error(
          'Failed to clean up uploaded file after document creation failed',
          cleanupError instanceof Error ? cleanupError.stack : undefined,
        );
      }
      throw error;
    }
  }
}
