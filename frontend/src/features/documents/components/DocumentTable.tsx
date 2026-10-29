import type { DocumentItem } from '../interfaces/document.interface'
import type { DocumentFilter } from '../types/document.type'
import { formatDate, formatFileSize } from '../utils/documentUtils'
import { Icon } from './Icon'
import { SearchResultsPanel } from './SearchResultsPanel'
import { StatusBadge } from './StatusBadge'
import type { ApiPagination, ApiSearchPage, ApiSearchResult } from '../interfaces/api.interface'

interface DocumentTableProps {
  documents: DocumentItem[]
  counts: { total: number; indexed: number; processing: number; error: number }
  isLoading: boolean
  query: string
  activeFilter: DocumentFilter
  onQueryChange: (query: string) => void
  onFilterChange: (filter: DocumentFilter) => void
  onSearch: () => void
  searchResults: ApiSearchPage | null
  isSearching: boolean
  searchError: string | null
  pagination: ApiPagination
  onPageChange: (page: number) => void
  onSearchResultOpen: (result: ApiSearchResult) => void
  onSearchPageChange: (page: number) => void
  onOpen: (document: DocumentItem) => void
  onEdit: (document: DocumentItem) => void
  onDelete: (document: DocumentItem) => void
}

const filters: { value: DocumentFilter; label: string; countKey: keyof DocumentTableProps['counts'] }[] = [
  { value: 'ALL', label: 'Todos', countKey: 'total' },
  { value: 'INDEXED', label: 'Indexados', countKey: 'indexed' },
  { value: 'PROCESSING', label: 'Procesando', countKey: 'processing' },
  { value: 'ERROR', label: 'Con error', countKey: 'error' },
]

export function DocumentTable({
  documents,
  counts,
  isLoading,
  query,
  activeFilter,
  onQueryChange,
  onFilterChange,
  onSearch,
  searchResults,
  isSearching,
  searchError,
  pagination,
  onPageChange,
  onSearchResultOpen,
  onSearchPageChange,
  onOpen,
  onEdit,
  onDelete,
}: DocumentTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#e7e7e7] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="border-b border-[#eeeeee] px-5 pb-4 pt-5 sm:px-6">
        <form onSubmit={(event) => { event.preventDefault(); onSearch() }} className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#222]">Todos los documentos</h2>
            <p className="mt-1 text-sm text-[#707070]">Filtra metadatos al instante; si no hay resultados, buscaremos en el contenido indexado.</p>
          </div>
          <div className="flex w-full gap-2 lg:max-w-[500px]">
            <label className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-[#dedede] bg-white px-3 text-[#707070] transition focus-within:border-[#ed1c24] focus-within:ring-2 focus-within:ring-red-50">
              <Icon name="search" className="h-[18px] w-[18px] shrink-0" />
              <input type="search" value={query} required onChange={(event) => onQueryChange(event.target.value)} placeholder="Nombre, metadatos o contenido" className="w-full border-0 bg-transparent text-sm text-[#222] outline-none placeholder:text-[#999]" />
            </label>
            <button type="submit" className="shrink-0 rounded-lg bg-[#ed1c24] px-4 text-sm font-semibold text-white transition hover:bg-[#c41219]">Buscar contenido</button>
          </div>
        </form>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-0.5">
          {filters.map(({ value, label, countKey }) => (
            <button key={value} type="button" onClick={() => onFilterChange(value)} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition ${activeFilter === value ? 'bg-[#fff0f0] text-[#c41219]' : 'bg-[#f5f5f5] text-[#666] hover:bg-[#eeeeee]'}`}>
              {label}
              <span className={`text-[11px] ${activeFilter === value ? 'text-[#c41219]' : 'text-[#929292]'}`}>{counts[countKey]}</span>
            </button>
          ))}
        </div>
      </div>
      <SearchResultsPanel
        results={searchResults}
        isSearching={isSearching}
        error={searchError}
        onOpen={onSearchResultOpen}
        onPageChange={onSearchPageChange}
        embedded
      />
      {documents.length ? (
        <DocumentRows documents={documents} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />
      ) : !isSearching && !searchResults?.items.length ? (
        <EmptyState isLoading={isLoading} />
      ) : null}
      <div className="flex items-center justify-between border-t border-[#eeeeee] px-5 py-3.5 text-xs text-[#858585] sm:px-6">
        <span>
          {pagination.total === 0
            ? 'Mostrando 0 documentos'
            : `Mostrando ${(pagination.page - 1) * pagination.limit + 1}–${(pagination.page - 1) * pagination.limit + documents.length} de ${pagination.total} documentos`}
        </span>
        <div className="flex items-center gap-3">
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button type="button" disabled={pagination.page <= 1 || isLoading} onClick={() => onPageChange(pagination.page - 1)} className="rounded-md border border-[#dedede] px-3 py-1.5 font-semibold text-[#555] disabled:opacity-40">Anterior</button>
              <span>Página {pagination.page} de {pagination.totalPages}</span>
              <button type="button" disabled={pagination.page >= pagination.totalPages || isLoading} onClick={() => onPageChange(pagination.page + 1)} className="rounded-md border border-[#dedede] px-3 py-1.5 font-semibold text-[#555] disabled:opacity-40">Siguiente</button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function DocumentRows({ documents, onOpen, onEdit, onDelete }: Pick<DocumentTableProps, 'documents' | 'onOpen' | 'onEdit' | 'onDelete'>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] border-collapse text-left">
        <thead>
          <tr className="bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.07em] text-[#858585]">
            <th className="px-6 py-3.5">Documento</th><th className="px-5 py-3.5">Categoría</th><th className="px-5 py-3.5">Tamaño</th><th className="px-5 py-3.5">Última actualización</th><th className="px-5 py-3.5">Estado</th><th className="px-5 py-3.5 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eeeeee]">
          {documents.map((document) => (
            <tr key={document.id} className="group transition hover:bg-[#fdfdfd]">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff1f1] text-[#c41219]"><Icon name="file" className="h-[19px] w-[19px]" /></span>
                  <div className="min-w-0">
                    <button type="button" onClick={() => onOpen(document)} className="max-w-[260px] truncate text-left text-sm font-semibold text-[#292929] hover:text-[#c41219]" title={`Abrir ${document.title}`}>{document.title}</button>
                    <p className="mt-1 max-w-[260px] truncate text-xs text-[#858585]" title={document.filename}>{document.filename} <span className="px-1 text-[#c9c9c9]">·</span> {document.version}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4"><span className="text-sm text-[#555]">{document.category}</span><p className="mt-1 text-xs text-[#999]">{document.author}</p></td>
              <td className="px-5 py-4 text-sm text-[#666]">{formatFileSize(document.size)}</td>
              <td className="px-5 py-4 text-xs text-[#707070]">{formatDate(document.uploadedAt)}</td>
              <td className="px-5 py-4"><StatusBadge status={document.status} /></td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-1">
                  <button type="button" onClick={() => onEdit(document)} aria-label={`Editar ${document.title}`} title="Editar metadatos" className="flex h-9 w-9 items-center justify-center rounded-lg text-[#727272] transition hover:bg-[#fff0f0] hover:text-[#c41219]"><Icon name="edit" className="h-[17px] w-[17px]" /></button>
                  <button type="button" onClick={() => onDelete(document)} aria-label={`Eliminar ${document.title}`} title="Eliminar documento" className="flex h-9 w-9 items-center justify-center rounded-lg text-[#727272] transition hover:bg-rose-50 hover:text-[#de350b]"><Icon name="trash" className="h-[17px] w-[17px]" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f5] text-[#929292]"><Icon name="search" className="h-5 w-5" /></span>
      <p className="text-sm font-semibold text-[#333]">{isLoading ? 'Cargando biblioteca…' : 'No encontramos documentos'}</p>
      {!isLoading && <p className="mt-1 text-sm text-[#858585]">Prueba con otro término o cambia el filtro seleccionado.</p>}
    </div>
  )
}
