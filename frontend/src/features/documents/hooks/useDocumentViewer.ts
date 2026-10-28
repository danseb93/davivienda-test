import { useCallback, useEffect, useState } from 'react'
import type { ApiDocument } from '../interfaces/api.interface'
import type { DocumentItem } from '../interfaces/document.interface'
import { getDocument, getOriginalFile } from '../services/documentApi'
import { mapApiDocument } from '../utils/documentUtils'

export interface DocumentViewerState {
  document: DocumentItem | null
  objectUrl: string | null
  text: string | null
  isLoading: boolean
  error: string | null
  searchTerm: string
}

export function useDocumentViewer() {
  const [selected, setSelected] = useState<{ id: string; searchTerm: string } | null>(null)
  const [viewer, setViewer] = useState<DocumentViewerState>({
    document: null,
    objectUrl: null,
    text: null,
    isLoading: false,
    error: null,
    searchTerm: '',
  })

  const close = useCallback(() => setSelected(null), [])

  const open = useCallback((id: string, searchTerm = '') => {
    setSelected({ id, searchTerm })
  }, [])

  const retry = useCallback(() => {
    setSelected((current) => current ? { ...current } : null)
  }, [])

  useEffect(() => {
    if (!selected) {
      setViewer((current) => ({ ...current, document: null, isLoading: false }))
      return
    }

    const controller = new AbortController()
    let objectUrl: string | null = null
    setViewer({
      document: null,
      objectUrl: null,
      text: null,
      isLoading: true,
      error: null,
      searchTerm: selected.searchTerm,
    })

    async function load() {
      try {
        const apiDocument: ApiDocument = await getDocument(selected.id)
        const document = mapApiDocument(apiDocument)
        const original = await getOriginalFile(selected.id, controller.signal)
        objectUrl = URL.createObjectURL(original.blob)
        const text = original.contentType === 'application/pdf'
          ? null
          : await original.blob.text()

        setViewer({
          document: { ...document, filename: original.filename },
          objectUrl,
          text,
          isLoading: false,
          error: null,
          searchTerm: selected.searchTerm,
        })
      } catch (error) {
        if (controller.signal.aborted) return
        setViewer((current) => ({
          ...current,
          isLoading: false,
          error: error instanceof Error ? error.message : 'No se pudo abrir el documento.',
        }))
      }
    }

    void load()
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [selected])

  return { ...viewer, isOpen: selected !== null, open, close, retry }
}
