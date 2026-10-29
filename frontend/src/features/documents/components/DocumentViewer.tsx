import { lazy, Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import type { DocumentItem } from '../interfaces/document.interface'
import { Icon } from './Icon'
import { createSearchExpression } from '../utils/searchExpression'

const PdfOriginalPreview = lazy(() => import('./PdfOriginalPreview').then((module) => ({
  default: module.PdfOriginalPreview,
})))

interface DocumentViewerProps {
  isOpen: boolean
  document: DocumentItem | null
  objectUrl: string | null
  previewUrl: string | null
  text: string | null
  searchTerm: string
  isLoading: boolean
  error: string | null
  onClose: () => void
  onRetry: () => void
}

export function DocumentViewer({ isOpen, document, objectUrl, previewUrl, text, searchTerm, isLoading, error, onClose, onRetry }: DocumentViewerProps) {
  const [activeMatchState, setActiveMatchState] = useState({ identity: '', index: 0 })
  const marks = useRef<Array<HTMLElement | null>>([])
  const identity = `${document?.id ?? ''}:${searchTerm}`
  const highlights = useMemo(() => text === null ? [] : getHighlights(text, searchTerm), [text, searchTerm])
  const activeMatch = activeMatchState.identity === identity ? activeMatchState.index : 0

  useEffect(() => {
    marks.current = []
  }, [identity])

  useEffect(() => {
    marks.current[activeMatch]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeMatch, highlights.length, identity])

  if (!isOpen) return null

  const isPdf = document?.mimeType === 'application/pdf'

  return (
    <div className="fixed inset-0 z-50 bg-black/35" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <aside className="document-drawer absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-[-12px_0_40px_rgba(0,0,0,0.16)] sm:max-w-2xl lg:max-w-3xl" role="dialog" aria-modal="true" aria-label="Visor de documento">
        <header className="flex items-center justify-between gap-4 border-b border-[#e7e7e7] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff1f1] text-[#c41219]"><Icon name="file" /></span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-[#222]">{document?.title ?? 'Abriendo documento…'}</h2>
              <p className="truncate text-xs text-[#777]">{document?.filename ?? 'Cargando metadatos'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar visor" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#777] hover:bg-[#f5f5f5]"><Icon name="close" /></button>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eeeeee] bg-[#fafafa] px-5 py-3 text-xs text-[#666] sm:px-6">
          <span>{document ? `${document.author} · ${document.category} · v${document.version}` : ' '}</span>
          {searchTerm && <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-900">Coincidencia: “{searchTerm}”</span>}
          {document?.mimeType !== 'application/pdf' && text !== null && highlights.length > 0 && (
            <div className="flex items-center gap-2">
              <span>{activeMatch + 1} de {highlights.length} coincidencias</span>
              <button type="button" aria-label="Coincidencia anterior" onClick={() => setActiveMatchState({ identity, index: (activeMatch - 1 + highlights.length) % highlights.length })} className="rounded border border-[#ddd] px-2 py-1 hover:bg-white">↑</button>
              <button type="button" aria-label="Siguiente coincidencia" onClick={() => setActiveMatchState({ identity, index: (activeMatch + 1) % highlights.length })} className="rounded border border-[#ddd] px-2 py-1 hover:bg-white">↓</button>
            </div>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-[#f5f5f5]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center gap-3 text-sm text-[#707070]"><Icon name="clock" className="h-5 w-5 animate-spin text-[#c41219]" /> Cargando archivo original…</div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <p role="alert" className="mb-4 text-sm text-[#de350b]">{error}</p>
              <button type="button" onClick={onRetry} className="rounded-lg border border-[#dedede] bg-white px-4 py-2 text-sm font-semibold">Reintentar</button>
            </div>
          ) : isPdf && previewUrl ? (
            <Suspense fallback={<div className="flex h-full min-h-[50vh] items-center justify-center gap-3 text-sm text-[#707070]"><Icon name="clock" className="h-5 w-5 animate-spin text-[#c41219]" /> Preparando visor PDF…</div>}>
              <PdfOriginalPreview key={`${document?.id}:${searchTerm}`} url={previewUrl} searchTerm={searchTerm} />
            </Suspense>
          ) : text !== null ? (
            <pre className="m-4 whitespace-pre-wrap break-words rounded-xl border border-[#e7e7e7] bg-white p-5 font-mono text-[13px] leading-6 text-[#333] shadow-sm sm:m-6 sm:p-7">
              {renderHighlightedText(text, highlights, activeMatch, marks)}
            </pre>
          ) : null}
        </div>
        {objectUrl && document && (
          <footer className="flex justify-end border-t border-[#eeeeee] px-5 py-3 sm:px-6">
            <a href={objectUrl} download={document.filename} className="inline-flex items-center gap-2 text-xs font-semibold text-[#c41219] hover:underline">
              <Icon name="upload" className="h-4 w-4 rotate-180" /> Descargar original
            </a>
          </footer>
        )}
      </aside>
    </div>
  )
}

interface HighlightRange {
  start: number
  end: number
  value: string
}

function getHighlights(text: string, searchTerm: string): HighlightRange[] {
  const expression = createSearchExpression(searchTerm)
  if (!expression) return []
  const highlights: HighlightRange[] = []
  let match: RegExpExecArray | null
  while ((match = expression.exec(text)) !== null) {
    highlights.push({ start: match.index, end: match.index + match[0].length, value: match[0] })
  }
  return highlights
}

function renderHighlightedText(text: string, highlights: HighlightRange[], activeIndex: number, marks: MutableRefObject<Array<HTMLElement | null>>) {
  if (!highlights.length) return text
  const parts = []
  let cursor = 0
  highlights.forEach((highlight, index) => {
    if (highlight.start > cursor) parts.push(text.slice(cursor, highlight.start))
    parts.push(
      <mark
        key={`${highlight.start}-${index}`}
        ref={(element) => { marks.current[index] = element }}
        className={`rounded px-0.5 ${index === activeIndex ? 'bg-[#ffcf66] ring-2 ring-[#ed1c24]/30' : 'bg-amber-100'}`}
      >
        {highlight.value}
      </mark>,
    )
    cursor = highlight.end
  })
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}
