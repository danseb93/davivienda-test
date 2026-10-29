import type { DocumentStatus } from '../types/document.type'

export interface ApiResponse<T = null> {
  statusCode: number
  success: boolean
  message: string
  data?: T
}

export interface ApiResponseWithData<T> extends ApiResponse<T> {
  data: T
}

export interface ApiPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiPaginatedResponse<T> extends ApiResponseWithData<T> {
  pagination: ApiPagination
}

export interface ApiDocumentCounts {
  total: number
  indexed: number
  processing: number
  error: number
}

export interface ApiDocument {
  id: string
  title: string
  author: string
  category: string
  tags: string[]
  version: string
  fileName: string
  mimeType: string
  fileSize: number
  status: DocumentStatus
  createdAt: Date
  updatedAt: Date
}

export interface ApiSearchResult {
  id: string
  title: string
  author: string
  category: string
  tags: string[]
  version: string
  snippet: string
  rank: number
}

export interface ApiSearchPage {
  items: ApiSearchResult[]
  pagination: ApiPagination
}

export interface ApiDocumentPage {
  items: ApiDocument[]
  pagination: ApiPagination
}

export interface DocumentMetadata {
  title: string
  author: string
  category: string
  version: string
  tags: string[]
}

export interface UploadMetadata extends Omit<DocumentMetadata, 'tags'> {
  tags: string
}

export type UpdateDocumentMetadata = Partial<DocumentMetadata>

export interface DocumentStatusEvent {
  id: string
  title: string
  status: DocumentStatus
  updatedAt: Date
}
