import { useEffect, useRef, useState } from 'react'
import type { DocumentForm, DocumentItem, UploadItem } from '../interfaces/document.interface'
import type { DocumentFilter, ToastKind } from '../types/document.type'
import { mockDocuments } from '../data/mockDocuments'
import { createId, getTitle, isSupportedFile } from '../utils/documentUtils'

type Notify = (kind: ToastKind, title: string, message: string) => void

export function useDocuments(notify: Notify) {
  const [documents, setDocuments] = useState(mockDocuments)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<DocumentFilter>('ALL')
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(null)
  const [deletingDocument, setDeletingDocument] = useState<DocumentItem | null>(null)
  const intervals = useRef(new Map<string, number>())
  const timeouts = useRef(new Map<string, number>())

  useEffect(() => () => {
    intervals.current.forEach(window.clearInterval)
    timeouts.current.forEach(window.clearTimeout)
  }, [])

  function addFiles(fileList: FileList | File[]) {
    const accepted: File[] = []
    const rejected: string[] = []

    Array.from(fileList).forEach((file) => {
      if (!isSupportedFile(file.name)) {
        rejected.push(`${file.name}: formato no compatible`)
      } else if (file.size > 25 * 1024 * 1024) {
        rejected.push(`${file.name}: supera el límite de 25 MB`)
      } else {
        accepted.push(file)
      }
    })

    if (rejected.length) {
      notify('error', 'Algunos archivos no se agregaron', rejected.slice(0, 2).join(' · '))
    }

    const newDocuments: DocumentItem[] = accepted.map((file) => ({
      id: createId(),
      filename: file.name,
      title: getTitle(file.name),
      author: 'Usuario actual',
      category: 'Otro',
      version: 'v1.0',
      tags: [],
      size: file.size,
      uploadedAt: new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date()),
      status: 'PROCESSING',
    }))

    if (!newDocuments.length) return

    setDocuments((current) => [...newDocuments, ...current])
    setUploads((current) => [
      ...newDocuments.map((document): UploadItem => ({
        id: document.id,
        filename: document.filename,
        size: document.size,
        progress: 0,
        stage: 'uploading',
      })),
      ...current,
    ])

    newDocuments.forEach((document) => {
      let progress = 0
      const interval = window.setInterval(() => {
        progress = Math.min(progress + 12, 100)
        setUploads((current) => current.map((upload) =>
          upload.id === document.id
            ? { ...upload, progress, stage: progress === 100 ? 'processing' : 'uploading' }
            : upload,
        ))

        if (progress === 100) {
          window.clearInterval(interval)
          intervals.current.delete(document.id)
          const timeout = window.setTimeout(() => {
            setDocuments((current) => current.map((item) =>
              item.id === document.id ? { ...item, status: 'INDEXED' } : item,
            ))
            setUploads((current) => current.map((upload) =>
              upload.id === document.id ? { ...upload, stage: 'done' } : upload,
            ))
            notify('success', 'Documento indexado', `${document.title} ya está disponible para búsqueda.`)
            timeouts.current.delete(document.id)
          }, 1_700)
          timeouts.current.set(document.id, timeout)
        }
      }, 170)
      intervals.current.set(document.id, interval)
    })
  }

  function saveDocument(id: string, form: DocumentForm) {
    setDocuments((current) => current.map((document) =>
      document.id === id
        ? { ...document, ...form, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean) }
        : document,
    ))
    setEditingDocument(null)
    notify('success', 'Cambios guardados', 'Los metadatos del documento se actualizaron.')
  }

  function deleteDocument() {
    if (!deletingDocument) return
    const { id, title } = deletingDocument
    setDocuments((current) => current.filter((document) => document.id !== id))
    setUploads((current) => current.filter((upload) => upload.id !== id))

    const interval = intervals.current.get(id)
    const timeout = timeouts.current.get(id)
    if (interval) window.clearInterval(interval)
    if (timeout) window.clearTimeout(timeout)
    intervals.current.delete(id)
    timeouts.current.delete(id)

    setDeletingDocument(null)
    notify('info', 'Documento eliminado', `${title} se eliminó de la lista.`)
  }

  const filteredDocuments = documents.filter((document) => {
    const matchesFilter = activeFilter === 'ALL' || document.status === activeFilter
    const searchableText = [
      document.title,
      document.filename,
      document.author,
      document.category,
      document.version,
      ...document.tags,
    ].join(' ').toLocaleLowerCase()
    return matchesFilter && searchableText.includes(query.trim().toLocaleLowerCase())
  })

  const counts = {
    total: documents.length,
    indexed: documents.filter((document) => document.status === 'INDEXED').length,
    processing: documents.filter((document) => document.status === 'PROCESSING').length,
    error: documents.filter((document) => document.status === 'ERROR').length,
  }

  return {
    documents,
    uploads,
    query,
    setQuery,
    activeFilter,
    setActiveFilter,
    filteredDocuments,
    counts,
    editingDocument,
    setEditingDocument,
    deletingDocument,
    setDeletingDocument,
    addFiles,
    saveDocument,
    deleteDocument,
    clearCompletedUploads: () => setUploads((current) => current.filter((upload) => upload.stage !== 'done')),
  }
}
