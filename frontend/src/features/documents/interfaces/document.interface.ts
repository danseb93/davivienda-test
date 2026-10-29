import type { DocumentStatus, ToastKind, UploadStage } from '../types/document.type'

export interface DocumentItem {
  id: string
  filename: string
  mimeType: string
  title: string
  author: string
  category: string
  version: string
  tags: string[]
  size: number
  uploadedAt: Date
  status: DocumentStatus
}

export interface UploadItem {
  id: string
  filename: string
  size: number
  progress: number
  stage: UploadStage
  error?: string
}

export interface ToastMessage {
  id: string
  kind: ToastKind
  title: string
  message: string
}

export interface DocumentForm {
  title: string
  author: string
  category: string
  version: string
  tags: string
}