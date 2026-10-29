import type { Pagination } from '../../../common/domain/pagination.entity.js';

export interface SearchDocumentsQuery
  extends Pick<Pagination, 'page' | 'limit'> {
  term: string;
}

export interface SearchDocumentResult {
  id: string;
  title: string;
  author: string;
  category: string;
  tags: string[];
  version: string;
  snippet: string;
  rank: number;
}

export interface SearchDocumentsResult {
  items: SearchDocumentResult[];
  total: number;
}

export interface SearchRepository {
  search(query: SearchDocumentsQuery): Promise<SearchDocumentsResult>;
}
