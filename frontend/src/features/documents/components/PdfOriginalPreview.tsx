import { getDocument, GlobalWorkerOptions, TextLayer, type PDFDocumentLoadingTask, type PDFDocumentProxy, type RenderTask } from 'pdfjs-dist'
import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { createSearchExpression } from '../utils/searchExpression'

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

interface PdfOriginalPreviewProps {
  url: string
  searchTerm: string
}

interface PageMatches {
  pageNumber: number
  count: number
}

export function PdfOriginalPreview({ url, searchTerm }: PdfOriginalPreviewProps) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [pageMatches, setPageMatches] = useState<PageMatches[]>([])
  const [activePageNumber, setActivePageNumber] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pagesWithMatches = pageMatches.length
  const activeMatchIndex = pageMatches.findIndex((match) => match.pageNumber === activePageNumber)
  const activePage = pageMatches[activeMatchIndex]

  useEffect(() => {
    let active = true
    let loadingTask: PDFDocumentLoadingTask | null = null
    let loadedPdf: PDFDocumentProxy | null = null

    async function loadPdf() {
      try {
        loadingTask = getDocument({ url })
        loadedPdf = await loadingTask.promise
        const matches: PageMatches[] = []
        for (let pageNumber = 1; pageNumber <= loadedPdf.numPages; pageNumber += 1) {
          const page = await loadedPdf.getPage(pageNumber)
          const text = await page.getTextContent()
          const pageText = text.items
            .filter((item): item is typeof item & { str: string } => 'str' in item)
            .map((item) => item.str)
            .join(' ')
          const count = countMatches(pageText, searchTerm)
          if (count > 0 || !searchTerm.trim()) matches.push({ pageNumber, count })
        }

        if (!active) {
          await loadingTask.destroy()
          return
        }
        setPdf(loadedPdf)
        setPageMatches(matches)
        setActivePageNumber(matches[0]?.pageNumber ?? 1)
        setIsLoading(false)
      } catch (loadError) {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : 'No se pudo interpretar el archivo PDF.')
        setIsLoading(false)
      }
    }

    void loadPdf()
    return () => {
      active = false
      if (loadingTask) void loadingTask.destroy()
    }
  }, [url, searchTerm])

  useEffect(() => {
    if (!pdf || !containerRef.current) return
    let active = true
    let renderTask: RenderTask | undefined
    const container = containerRef.current
    container.replaceChildren()

    async function renderPage() {
      try {
        const page = await pdf.getPage(activePageNumber)
        if (!active) return
        const viewport = page.getViewport({ scale: 1.15 })
        const wrapper = document.createElement('div')
        wrapper.className = 'pdf-page'
        wrapper.style.width = `${viewport.width}px`
        wrapper.style.height = `${viewport.height}px`

        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) throw new Error('El navegador no pudo preparar el visor PDF.')
        const pixelRatio = window.devicePixelRatio || 1
        canvas.width = Math.ceil(viewport.width * pixelRatio)
        canvas.height = Math.ceil(viewport.height * pixelRatio)
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`
        wrapper.append(canvas)

        const textLayerElement = document.createElement('div')
        textLayerElement.className = 'textLayer'
        textLayerElement.style.setProperty('--total-scale-factor', String(viewport.scale))
        wrapper.append(textLayerElement)
        container.append(wrapper)

        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        })
        const [textContent] = await Promise.all([page.getTextContent(), renderTask.promise])
        if (!active) return
        const textLayer = new TextLayer({ textContentSource: textContent, container: textLayerElement, viewport })
        await textLayer.render()
        if (active) highlightTextLayer(textLayerElement, searchTerm)
      } catch (renderError) {
        if (active) setError(renderError instanceof Error ? renderError.message : 'No se pudo mostrar esta página del PDF.')
      }
    }

    void renderPage()
    return () => {
      active = false
      renderTask?.cancel()
      container.replaceChildren()
    }
  }, [pdf, activePageNumber, searchTerm])

  function moveMatch(direction: -1 | 1) {
    if (!pagesWithMatches) return
    let nextMatchIndex: number
    if (activeMatchIndex >= 0) {
      nextMatchIndex = (activeMatchIndex + direction + pagesWithMatches) % pagesWithMatches
    } else if (direction === 1) {
      const next = pageMatches.findIndex((match) => match.pageNumber > activePageNumber)
      nextMatchIndex = next >= 0 ? next : 0
    } else {
      const previous = pageMatches.findLastIndex((match) => match.pageNumber < activePageNumber)
      nextMatchIndex = previous >= 0 ? previous : pagesWithMatches - 1
    }
    setActivePageNumber(pageMatches[nextMatchIndex].pageNumber)
  }

  function movePage(direction: -1 | 1) {
    if (!pdf) return
    setActivePageNumber((current) => Math.max(1, Math.min(pdf.numPages, current + direction)))
  }

  if (isLoading) {
    return <div className="flex h-full min-h-[50vh] items-center justify-center gap-3 text-sm text-[#707070]"><Icon name="clock" className="h-5 w-5 animate-spin text-[#c41219]" /> Abriendo y buscando en el PDF…</div>
  }

  if (error) return <div role="alert" className="p-8 text-center text-sm text-[#de350b]">{error}</div>

  return (
    <div className="flex h-full min-h-[60vh] flex-col">
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b border-[#e7e7e7] px-4 py-2 text-xs ${searchTerm ? 'bg-[#fffaf0] text-[#70500b]' : 'text-[#666]'}`}>
        {searchTerm && (
          <>
            <span>{pagesWithMatches ? `${activePage?.count ?? 0} coincidencias en esta página` : 'No se encontró la frase en el texto extraíble del PDF'}</span>
            {pagesWithMatches > 0 && (
              <div className="flex items-center gap-2">
                <span>{activeMatchIndex >= 0 ? `Página con coincidencia ${activeMatchIndex + 1} de ${pagesWithMatches}` : `${pagesWithMatches} páginas con coincidencias`}</span>
                <button type="button" aria-label="Coincidencia anterior" onClick={() => moveMatch(-1)} className="rounded border border-[#e1d7bc] bg-white px-2 py-1 hover:bg-[#fff7e2]">↑</button>
                <button type="button" aria-label="Siguiente coincidencia" onClick={() => moveMatch(1)} className="rounded border border-[#e1d7bc] bg-white px-2 py-1 hover:bg-[#fff7e2]">↓</button>
              </div>
            )}
          </>
        )}
        {pdf && (
          <div className="ml-auto flex items-center gap-2">
            <span>Página {activePageNumber} de {pdf.numPages}</span>
            <button type="button" disabled={activePageNumber <= 1} onClick={() => movePage(-1)} className="rounded border border-[#ddd] bg-white px-2 py-1 disabled:opacity-40">Anterior</button>
            <button type="button" disabled={activePageNumber >= pdf.numPages} onClick={() => movePage(1)} className="rounded border border-[#ddd] bg-white px-2 py-1 disabled:opacity-40">Siguiente</button>
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
        <div ref={containerRef} className="mx-auto flex w-fit flex-col gap-5" />
      </div>
    </div>
  )
}

function countMatches(text: string, searchTerm: string) {
  const expression = createSearchExpression(searchTerm)
  if (!expression) return 0
  return Array.from(text.matchAll(expression)).length
}

function highlightTextLayer(layer: HTMLElement, searchTerm: string) {
  const expression = createSearchExpression(searchTerm)
  if (!expression) return

  const walker = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT)
  const textNodes: Array<{ node: Text; start: number; end: number }> = []
  let combinedText = ''
  let previousBounds: DOMRect | null = null
  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    if (!node.textContent) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const bounds = range.getBoundingClientRect()
    if (textNodes.length && previousBounds) {
      const lineChanged =
        Math.abs(bounds.top - previousBounds.top) >
        Math.max(bounds.height, previousBounds.height) * 0.5
      const gap = bounds.left - previousBounds.right
      const separatesWords =
        gap > Math.max(bounds.height, previousBounds.height) * 0.2
      if (lineChanged || separatesWords) combinedText += ' '
    }
    const start = combinedText.length
    combinedText += node.textContent
    textNodes.push({ node, start, end: combinedText.length })
    previousBounds = bounds
  }

  const layerBounds = layer.getBoundingClientRect()
  Array.from(combinedText.matchAll(expression), (match) => ({
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  })).forEach(({ start, end }) => {
    const startNode = textNodes.find((item) => item.start <= start && start < item.end)
    const endNode = textNodes.find((item) => item.start < end && end <= item.end)
    if (!startNode || !endNode) return

    const selection = document.createRange()
    selection.setStart(startNode.node, start - startNode.start)
    selection.setEnd(endNode.node, end - endNode.start)
    for (const rect of Array.from(selection.getClientRects())) {
      const highlight = document.createElement('span')
      highlight.className = 'pdf-search-highlight'
      highlight.setAttribute('aria-hidden', 'true')
      highlight.style.left = `${rect.left - layerBounds.left}px`
      highlight.style.top = `${rect.top - layerBounds.top}px`
      highlight.style.width = `${rect.width}px`
      highlight.style.height = `${rect.height}px`
      layer.append(highlight)
    }
  })
}
