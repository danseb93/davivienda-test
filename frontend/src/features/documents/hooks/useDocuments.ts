import { useCallback, useEffect, useRef, useState } from 'react'
import type { DocumentForm, DocumentItem, UploadItem } from '../interfaces/document.interface'
import type { DocumentFilter, ToastKind } from '../types/document.type'
import type { DocumentStatusEvent, UploadMetadata } from '../interfaces/api.interface'
import { maxBatchFiles, uploadConcurrency } from '../config/documentConfig'
import {
  countDocuments,
  deleteDocument as deleteDocumentRequest,
  listDocuments,
  subscribeToDocuments,
  updateDocument as updateDocumentRequest,
  uploadDocument,
} from '../services/documentApi'
import { createId, getTitle, isSupportedFile, mapApiDocument } from '../utils/documentUtils'

type Notify = (kind: ToastKind, title: string, message: string) => void

const maxFileSize = 25 * 1024 * 1024
const documentPageSize = 10

export function useDocuments(notify: Notify) {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<DocumentFilter>('ALL')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: documentPageSize,
    total: 0,
    totalPages: 0,
  })
  const [counts, setCounts] = useState({
    total: 0,
    indexed: 0,
    processing: 0,
    error: 0,
  })
  const [reloadVersion, setReloadVersion] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(null)
  const [deletingDocument, setDeletingDocument] = useState<DocumentItem | null>(null)
  const documentTitles = useRef(new Map<string, string>())
  const pendingStatusEvents = useRef(new Map<string, DocumentStatusEvent>())
  const countRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countRequestVersion = useRef(0)
  const currentNotify = useRef(notify)

  useEffect(() => {
    currentNotify.current = notify
  }, [notify])

  const reloadDocuments = useCallback(() => {
    setIsLoading(true)
    if (reloadTimer.current) clearTimeout(reloadTimer.current)
    reloadTimer.current = setTimeout(() => {
      reloadTimer.current = null
      setReloadVersion((current) => current + 1)
    }, 250)
  }, [])

  const refreshCounts = useCallback(() => {
    if (countRefreshTimer.current) return
    countRefreshTimer.current = setTimeout(() => {
      countRefreshTimer.current = null
      const requestVersion = ++countRequestVersion.current
      void countDocuments()
        .then((result) => {
          if (requestVersion === countRequestVersion.current) setCounts(result)
        })
        .catch((error: unknown) => {
          if (requestVersion === countRequestVersion.current) {
            currentNotify.current('error', 'No se pudieron cargar los conteos', getMessage(error))
          }
        })
    }, 250)
  }, [])

  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      void listDocuments({
        page,
        limit: documentPageSize,
        search: query.trim() || undefined,
        status: activeFilter === 'ALL' ? undefined : activeFilter,
      })
        .then((result) => {
          if (!active) return
          setDocuments(result.items.map(mapApiDocument))
          setPagination(result.pagination)
        })
        .catch((error: unknown) => {
          if (!active) return
          setDocuments([])
          setPagination({ page, limit: documentPageSize, total: 0, totalPages: 0 })
          notify('error', 'No se pudieron cargar los documentos', getMessage(error))
        })
        .finally(() => {
          if (active) setIsLoading(false)
        })
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [activeFilter, notify, page, query, reloadVersion])

  useEffect(() => {
    refreshCounts()
  }, [refreshCounts])

  useEffect(() => () => {
    if (countRefreshTimer.current) {
      clearTimeout(countRefreshTimer.current)
      countRefreshTimer.current = null
    }
    if (reloadTimer.current) {
      clearTimeout(reloadTimer.current)
      reloadTimer.current = null
    }
  }, [])

  const changeQuery = useCallback((value: string) => {
    if (value === query) return
    setIsLoading(true)
    setQuery(value)
    setPage(1)
  }, [query])

  const changeFilter = useCallback((filter: DocumentFilter) => {
    if (filter === activeFilter && page === 1) return
    setIsLoading(true)
    setActiveFilter(filter)
    setPage(1)
  }, [activeFilter, page])

  const changePage = useCallback((nextPage: number) => {
    if (nextPage === page) return
    setIsLoading(true)
    setPage(nextPage)
  }, [page])

  useEffect(() => {
    let active = true
    let reportedStreamError = false
    const source = subscribeToDocuments(
      (event) => {
        if (!active || event.status === 'PROCESSING') return
        reportedStreamError = false
        setDocuments((current) => current.map((document) =>
          document.id === event.id
            ? { ...document, status: event.status, uploadedAt: event.updatedAt }
            : document,
        ))
        setUploads((current) => current.map((upload) =>
          upload.id === event.id
            ? { ...upload, stage: event.status === 'INDEXED' ? 'done' : 'error', progress: 100 }
            : upload,
        ))
        const title = event.title || documentTitles.current.get(event.id)
        if (title) {
          if (event.status === 'INDEXED') {
            notify('success', 'Documento indexado', `${title} ya está disponible para búsqueda.`)
          } else {
            notify('error', 'Falló la indexación', `${title} se cargó, pero el backend no pudo procesarlo.`)
          }
        }
        if (!documentTitles.current.has(event.id)) {
          pendingStatusEvents.current.set(event.id, event)
          if (pendingStatusEvents.current.size > maxBatchFiles) {
            const oldestId = pendingStatusEvents.current.keys().next().value
            if (oldestId) pendingStatusEvents.current.delete(oldestId)
          }
        }
        refreshCounts()
        reloadDocuments()
      },
      () => {
        if (!active || reportedStreamError) return
        reportedStreamError = true
        notify('info', 'Reconectando con el procesamiento', 'Se perdió temporalmente la conexión de eventos. El navegador intentará reconectarse.')
      }
    )
    return () => {
      active = false
      source.close()
    }
  }, [notify, refreshCounts, reloadDocuments])

  const uploadFiles = useCallback(async (files: File[], metadata: Omit<UploadMetadata, 'title'>) => {
    if (files.length > maxBatchFiles) {
      notify(
        'error',
        `Máximo ${maxBatchFiles} documentos`,
        `Divide la selección en lotes de hasta ${maxBatchFiles} archivos.`,
      )
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
          documentTitles.current.set(created.id, created.title)
          const earlyStatus = pendingStatusEvents.current.get(created.id)
          pendingStatusEvents.current.delete(created.id)
          setUploads((current) => current.map((upload) =>
            upload.id === localId
              ? {
                  ...upload,
                  id: created.id,
                  progress: 100,
                  stage: earlyStatus
                    ? earlyStatus.status === 'INDEXED' ? 'done' : 'error'
                    : 'uploaded',
                }
              : upload,
          ))
          refreshCounts()
          reloadDocuments()
          if (earlyStatus && !earlyStatus.title) {
            if (earlyStatus.status === 'INDEXED') {
              notify('success', 'Documento indexado', `${created.title} ya está disponible para búsqueda.`)
            } else {
              notify('error', 'Falló la indexación', `${created.title} se cargó, pero el backend no pudo procesarlo.`)
            }
          }
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
    reloadDocuments()
  }, [notify, refreshCounts, reloadDocuments])

  const saveDocument = useCallback(async (id: string, form: DocumentForm) => {
    try {
      const updated = mapApiDocument(await updateDocumentRequest(id, {
        ...form,
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      }))
      setDocuments((current) => current.map((document) => document.id === id ? updated : document))
      setEditingDocument(null)
      notify('success', 'Cambios guardados', 'Los metadatos del documento se actualizaron.')
      refreshCounts()
      reloadDocuments()
    } catch (error) {
      notify('error', 'No se pudieron guardar los cambios', getMessage(error))
    }
  }, [notify, refreshCounts, reloadDocuments])

  const deleteDocument = useCallback(async () => {
    if (!deletingDocument) return
    const { id, title } = deletingDocument
    try {
      await deleteDocumentRequest(id)
      setDocuments((current) => current.filter((document) => document.id !== id))
      setUploads((current) => current.filter((upload) => upload.id !== id))
      documentTitles.current.delete(id)
      pendingStatusEvents.current.delete(id)
      setDeletingDocument(null)
      notify('info', 'Documento eliminado', `${title} se eliminó de la biblioteca.`)
      refreshCounts()
      if (documents.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        reloadDocuments()
      }
    } catch (error) {
      notify('error', 'No se pudo eliminar el documento', getMessage(error))
    }
  }, [deletingDocument, documents.length, notify, page, refreshCounts, reloadDocuments])

  return {
    documents,
    uploads,
    query,
    setQuery: changeQuery,
    activeFilter,
    setActiveFilter: changeFilter,
    filteredDocuments: documents,
    counts,
    page,
    setPage: changePage,
    pagination,
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
