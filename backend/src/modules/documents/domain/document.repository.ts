import { Document } from './document.entity.js';
import type { Pagination } from '../../../common/domain/pagination.entity.js';

export interface DocumentCounts {
  total: number;
  indexed: number;
  processing: number;
  error: number;
}

export interface PaginatedDocuments {
  items: Omit<Document, 'storageName' | 'content'>[];
  total: number;
}

export type CreateDocumentData = Pick<
  Document,
  | 'title'
  | 'author'
  | 'category'
  | 'tags'
  | 'version'
  | 'fileName'
  | 'storageName'
  | 'mimeType'
  | 'fileSize'
  | 'status'
>;

export type UpdateDocumentData = Partial<
  Pick<Document, 'title' | 'author' | 'category' | 'tags' | 'version'>
>;

export interface DocumentProcessingResult {
  id: string;
  title: string;
  status: 'INDEXED' | 'ERROR';
  updatedAt: Date;
  error?: unknown;
}

export interface DocumentRepository {
  findAll(
    query: Pagination,
    status?: Document['status'],
  ): Promise<PaginatedDocuments>;
  findCounts(): Promise<DocumentCounts>;
  findById(id: string): Promise<Document | null>;
  create(data: CreateDocumentData): Promise<Document>;
  update(id: string, data: UpdateDocumentData): Promise<Document>;
  delete(id: string): Promise<Document>;
  processNextPending(
    extractContent: (document: Document) => Promise<string>,
  ): Promise<DocumentProcessingResult | null>;
}
