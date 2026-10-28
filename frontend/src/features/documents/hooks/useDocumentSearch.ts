import { useCallback, useRef, useState } from 'react'
import type { ApiSearchPage } from '../interfaces/api.interface'
import { searchDocuments } from '../services/documentApi'

export function useDocumentSearch() {
  const [results, setResults] = useState<ApiSearchPage | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedQuery, setSubmittedQuery] = useState('')
  const requestId = useRef(0)

  const search = useCallback(async (query: string, page = 1) => {
    const term = query.trim()
    if (!term) {
      requestId.current += 1
      setResults(null)
      setSubmittedQuery('')
      setIsSearching(false)
      setError(null)
      return
    }

    const currentRequestId = ++requestId.current
    setSubmittedQuery(term)
    setResults(null)
    setIsSearching(true)
    setError(null)
    try {
      const response = await searchDocuments(term, page)
      if (currentRequestId === requestId.current) setResults(response)
    } catch (requestError) {
      if (currentRequestId === requestId.current) {
        setError(requestError instanceof Error ? requestError.message : 'No se pudo completar la búsqueda.')
        setResults(null)
      }
    } finally {
      if (currentRequestId === requestId.current) setIsSearching(false)
    }
  }, [])

  const clear = useCallback(() => {
    requestId.current += 1
    setResults(null)
    setError(null)
    setSubmittedQuery('')
    setIsSearching(false)
  }, [])

  return { results, isSearching, error, submittedQuery, search, clear }
}
