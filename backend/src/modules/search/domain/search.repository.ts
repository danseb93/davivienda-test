export interface SearchDocumentsQuery {
  term: string;
  limit: number;
  offset: number;
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
