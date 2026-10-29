import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  DocumentCounts,
  DocumentRepository,
} from '../domain/document.repository.js';
import { Document } from '../domain/document.entity.js';
import type { Pagination } from '../../../common/domain/pagination.entity.js';
import type { DocumentQueryDto } from '../dto/document.dto.js';
import { SortOrder } from '../../../common/index.js';

@Injectable()
export class DocumentFinderService {
  constructor(
    @Inject('DocumentRepository')
    private readonly documentRepository: DocumentRepository,
  ) {}

  async findAll(query: DocumentQueryDto): Promise<{
    documents: Omit<Document, 'storageName' | 'content'>[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const pagination: Pagination = {
      page,
      limit,
      search: query.search?.trim() || undefined,
      sort: query.sort ?? 'createdAt',
      order: query.order ?? SortOrder.DESC,
    };
    const result = await this.documentRepository.findAll(pagination, query.status);

    return {
      documents: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  findCounts(): Promise<DocumentCounts> {
    return this.documentRepository.findCounts();
  }

  async findById(id: string): Promise<Document> {
    const document = await this.documentRepository.findById(id);
    if (!document) {
      throw new NotFoundException(`Document "${id}" not found`);
    }

    return document;
  }
}
