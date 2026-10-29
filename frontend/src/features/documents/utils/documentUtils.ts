import type { ApiDocument } from '../interfaces/api.interface'
import type { DocumentItem } from '../interfaces/document.interface'

export function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function mapApiDocument(document: ApiDocument): DocumentItem {
  return {
    id: document.id,
    filename: document.fileName,
    mimeType: document.mimeType,
    title: document.title,
    author: document.author,
    category: document.category,
    version: document.version,
    tags: document.tags,
    size: document.fileSize,
    uploadedAt: document.updatedAt,
    status: document.status,
  }
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatFileSize(bytes: number) {
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1_000))} KB`
  return `${(bytes / 1_000_000).toFixed(1)} MB`
}

export function getTitle(filename: string) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function isSupportedFile(filename: string) {
  const extension = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  return ['.pdf', '.txt', '.md', '.markdown'].includes(extension)
}
