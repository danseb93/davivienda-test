import { useCallback, useEffect, useRef, useState } from 'react'
import type { DocumentForm, DocumentItem, UploadItem } from '../interfaces/document.interface'
import type { DocumentFilter, ToastKind } from '../types/document.type'
import type { UploadMetadata } from '../interfaces/api.interface'
import {
  deleteDocument as deleteDocumentRequest,
  listDocuments,
  subscribeToDocument,
  updateDocument as updateDocumentRequest,
  uploadDocument,
} from '../services/documentApi'
import { createId, getTitle, isSupportedFile, mapApiDocument } from '../utils/documentUtils'

type Notify = (kind: ToastKind, title: string, message: string) => void

const maxBatchFiles = 20
const maxFileSize = 25 * 1024 * 1024
const uploadConcurrency = 3

export function useDocuments(notify: Notify) {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<DocumentFilter>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(null)
  const [deletingDocument, setDeletingDocument] = useState<DocumentItem | null>(null)
  const streams = useRef(new Map<string, EventSource>())
  const reportedStreamErrors = useRef(new Set<string>())

  useEffect(() => {
    let active = true
    const activeStreams = streams.current

    void listDocuments()
      .then((items) => {
        if (active) setDocuments(items.map(mapApiDocument))
      })
      .catch((error: unknown) => {
        if (!active) return
        setDocuments([])
        notify('error', 'No se pudieron cargar los documentos', getMessage(error))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
      activeStreams.forEach((source) => source.close())
      activeStreams.clear()
    }
  }, [notify])

  const trackProcessing = useCallback((document: DocumentItem) => {
    const source = subscribeToDocument(
      document.id,
      (event) => {
        if (event.status === 'PROCESSING') return
        setDocuments((current) => current.map((item) =>
          item.id === event.id ? { ...item, status: event.status, uploadedAt: formatDate(event.updatedAt) } : item,
        ))
        setUploads((current) => current.map((upload) =>
          upload.id === event.id ? { ...upload, stage: event.status === 'INDEXED' ? 'done' : 'error', progress: 100 } : upload,
        ))
        if (event.status === 'INDEXED') {
          notify('success', 'Documento indexado', `${document.title} ya está disponible para búsqueda.`)
        } else {
          notify('error', 'Falló la indexación', `${document.title} se cargó, pero el backend no pudo procesarlo.`)
        }
        source.close()
        streams.current.delete(event.id)
        reportedStreamErrors.current.delete(event.id)
      },
      () => {
        if (reportedStreamErrors.current.has(document.id)) return
        reportedStreamErrors.current.add(document.id)
        notify('info', 'Reconectando con el procesamiento', `Se perdió temporalmente la conexión de ${document.title}. El navegador intentará reconectarse.`)
      },
    )
    streams.current.set(document.id, source)
  }, [notify])

  useEffect(() => {
    documents.forEach((document) => {
      if (document.status === 'PROCESSING' && !streams.current.has(document.id)) {
        trackProcessing(document)
      }
    })
  }, [documents, trackProcessing])

  const uploadFiles = useCallback(async (files: File[], metadata: Omit<UploadMetadata, 'title'>) => {
    if (files.length > maxBatchFiles) {
      notify('error', 'Máximo 20 documentos', 'Divide la selección en lotes de hasta 20 archivos.')
      return
    }

    const accepted: File[] = []
    files.forEach((file) => {
      if (!isSupportedFile(file.name)) {
        notify('error', 'Formato no compatible', `${file.name}: selecciona un archivo PDF, TXT o Markdown.`)
      } else if (file.size > maxFileSize) {
        notify('error', 'Archivo demasiado grande', `${file.name}: el límite es de 25 MB por archivo.`)
      } else {
        accepted.push(file)
      }
    })
    if (!accepted.length) return

    const batch = accepted.map((file) => ({
      file,
      localId: createId(),
      title: getTitle(file.name),
    }))
    setUploads((current) => [
      ...batch.map(({ file, localId }): UploadItem => ({
        id: localId,
        filename: file.name,
        size: file.size,
        progress: 0,
        stage: 'queued',
      })),
      ...current,
    ])

    let nextIndex = 0
    async function uploadNext() {
      while (nextIndex < batch.length) {
        const index = nextIndex
        nextIndex += 1
        const { file, localId, title } = batch[index]
        setUploads((current) => current.map((upload) =>
          upload.id === localId ? { ...upload, stage: 'uploading' } : upload,
        ))

        try {
          const created = mapApiDocument(await uploadDocument(
            file,
            { ...metadata, title },
            (progress) => setUploads((current) => current.map((upload) =>
              upload.id === localId ? { ...upload, progress } : upload,
            )),
          ))
          setDocuments((current) => [created, ...current.filter((item) => item.id !== created.id)])
          setUploads((current) => current.map((upload) =>
            upload.id === localId
              ? { ...upload, id: created.id, progress: 100, stage: 'processing' }
              : upload,
          ))
          trackProcessing(created)
        } catch (error) {
          const message = getMessage(error)
          setUploads((current) => current.map((upload) =>
            upload.id === localId ? { ...upload, stage: 'error', error: message } : upload,
          ))
          notify('error', `No se pudo cargar ${file.name}`, message)
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(uploadConcurrency, batch.length) }, () => uploadNext()),
    )
  }, [notify, trackProcessing])

  const saveDocument = useCallback(async (id: string, form: DocumentForm) => {
    try {
      const updated = mapApiDocument(await updateDocumentRequest(id, {
        ...form,
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      }))
      setDocuments((current) => current.map((document) => document.id === id ? updated : document))
      setEditingDocument(null)
      notify('success', 'Cambios guardados', 'Los metadatos del documento se actualizaron.')
    } catch (error) {
      notify('error', 'No se pudieron guardar los cambios', getMessage(error))
    }
  }, [notify])

  const deleteDocument = useCallback(async () => {
    if (!deletingDocument) return
    const { id, title } = deletingDocument
    try {
      await deleteDocumentRequest(id)
      setDocuments((current) => current.filter((document) => document.id !== id))
      setUploads((current) => current.filter((upload) => upload.id !== id))
      streams.current.get(id)?.close()
      streams.current.delete(id)
      setDeletingDocument(null)
      notify('info', 'Documento eliminado', `${title} se eliminó de la biblioteca.`)
    } catch (error) {
      notify('error', 'No se pudo eliminar el documento', getMessage(error))
    }
  }, [deletingDocument, notify])

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
    isLoading,
    editingDocument,
    setEditingDocument,
    deletingDocument,
    setDeletingDocument,
    uploadFiles,
    saveDocument,
    deleteDocument,
    clearCompletedUploads: () => setUploads((current) => current.filter((upload) => upload.stage !== 'done')),
  }
}

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
