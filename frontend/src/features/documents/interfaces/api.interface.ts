import type { DocumentStatus } from '../types/document.type'

export interface ApiResponse<T> {
  statusCode: number
  success: boolean
  message: string
  data: T
  pagination?: ApiPagination
}

export interface ApiPagination {
  page: number
  limit: number
  total: number
  totalPages: number
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
  createdAt: string
  updatedAt: string
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

export interface UploadMetadata {
  title: string
  author: string
  category: string
  version: string
  tags: string
}

export interface DocumentStatusEvent {
  id: string
  title: string
  status: DocumentStatus
  updatedAt: string
}
