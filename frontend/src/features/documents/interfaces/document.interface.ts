import type { DocumentStatus, ToastKind, UploadStage } from '../types/document.type'

export interface DocumentItem {
  id: string
  filename: string
  title: string
  author: string
  category: string
  version: string
  tags: string[]
  size: number
  uploadedAt: string
  status: DocumentStatus
}

export interface UploadItem {
  id: string
  filename: string
  size: number
  progress: number
  stage: UploadStage
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