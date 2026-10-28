import type { ApiSearchPage, ApiSearchResult } from '../interfaces/api.interface'
import { Icon } from './Icon'

interface SearchResultsPanelProps {
  query: string
  results: ApiSearchPage | null
  isSearching: boolean
  error: string | null
  onOpen: (result: ApiSearchResult) => void
  onPageChange: (page: number) => void
  onClose: () => void
  embedded?: boolean
}

export function SearchResultsPanel({ query, results, isSearching, error, onOpen, onPageChange, onClose, embedded = false }: SearchResultsPanelProps) {
  if (!results && !isSearching && !error) return null

  return (
    <section className={`${embedded ? 'border-b border-[#eeeeee]' : 'mb-6 overflow-hidden rounded-2xl border border-[#e7e7e7] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]'}`} aria-label="Resultados de búsqueda en contenido">
      <div className="flex items-start justify-between border-b border-[#eeeeee] px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-bold text-[#222]">Resultados en el contenido</h2>
          <p className="mt-1 text-sm text-[#707070]">Coincidencias para <span className="font-semibold text-[#333]">“{query}”</span></p>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar resultados" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#777] hover:bg-[#f5f5f5]"><Icon name="close" className="h-4 w-4" /></button>
      </div>
      {isSearching ? (
        <div role="status" aria-live="polite" className="flex items-center gap-3 px-6 py-10 text-sm text-[#707070]">
          <Icon name="clock" className="h-5 w-5 animate-spin text-[#c41219]" />
          <span>
            <span className="block font-semibold text-[#333]">Búsqueda avanzada en curso</span>
            <span className="mt-0.5 block">Consultando el índice de contenido de los documentos…</span>
          </span>
        </div>
      ) : error ? (
        <div role="alert" className="px-6 py-8 text-sm text-[#de350b]">{error}</div>
      ) : results && results.items.length ? (
        <>
          <div className="divide-y divide-[#eeeeee]">
            {results.items.map((result) => (
              <button key={result.id} type="button" onClick={() => onOpen(result)} className="block w-full px-5 py-4 text-left transition hover:bg-[#fcfcfc] sm:px-6">
                <span className="flex items-start justify-between gap-4">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#c41219]">{result.title}</span>
                    <span className="mt-1 block text-xs text-[#777]">{result.author} · {result.category} · v{result.version}</span>
                  </span>
                  <span className="shrink-0 pt-0.5 text-[11px] text-[#999]">Relevancia {result.rank.toFixed(2)}</span>
                </span>
                <span className="mt-3 block text-sm leading-6 text-[#555]">{renderSnippet(result.snippet)}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#c41219]">Abrir documento <Icon name="chevron" className="h-3.5 w-3.5" /></span>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-[#eeeeee] px-5 py-3 text-xs text-[#777] sm:px-6">
            <span>{results.total} resultados · Página {results.page} de {Math.max(results.totalPages, 1)}</span>
            <div className="flex gap-2">
              <button type="button" disabled={results.page <= 1 || isSearching} onClick={() => onPageChange(results.page - 1)} className="rounded-md border border-[#dedede] px-3 py-1.5 font-semibold disabled:opacity-40">Anterior</button>
              <button type="button" disabled={results.page >= results.totalPages || isSearching} onClick={() => onPageChange(results.page + 1)} className="rounded-md border border-[#dedede] px-3 py-1.5 font-semibold disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        </>
      ) : (
        <div className="px-6 py-9 text-sm text-[#707070]">No se encontraron coincidencias en el contenido indexado.</div>
      )}
    </section>
  )
}

function renderSnippet(snippet: string) {
  let highlighted = false
  return snippet.split(/(<mark>|<\/mark>)/gi).map((part, index) => {
    if (part.toLowerCase() === '<mark>') {
      highlighted = true
      return null
    }
    if (part.toLowerCase() === '</mark>') {
      highlighted = false
      return null
    }
    const text = decodeHtml(part)
    return highlighted
      ? <mark key={index} className="rounded bg-amber-100 px-0.5 text-[#3b2b00]">{text}</mark>
      : <span key={index}>{text}</span>
  })
}

function decodeHtml(value: string) {
  const parsed = new DOMParser().parseFromString(value, 'text/html')
  return parsed.body.textContent ?? value
}
