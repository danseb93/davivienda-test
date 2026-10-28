import type { FormEvent, ReactNode } from 'react'
import type { UploadMetadata } from '../interfaces/api.interface'
import { documentCategories } from '../data/documentCategories'
import { Icon } from './Icon'

interface BulkUploadModalProps {
  files: File[]
  onClose: () => void
  onSubmit: (metadata: Omit<UploadMetadata, 'title'>) => void
}

export function BulkUploadModal({ files, onClose, onSubmit }: BulkUploadModalProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    onSubmit({
      author: String(formData.get('author')).trim(),
      category: String(formData.get('category')),
      version: String(formData.get('version')).trim(),
      tags: String(formData.get('tags')).trim(),
    })
  }

  return (
    <Modal title={`Cargar ${files.length} ${files.length === 1 ? 'documento' : 'documentos'}`} onClose={onClose}>
      <p className="mb-4 text-sm leading-6 text-[#707070]">
        El título se toma del nombre de cada archivo. Estos metadatos se aplicarán a todos los documentos del lote.
      </p>
      <div className="mb-5 max-h-32 overflow-y-auto rounded-lg bg-[#f7f7f7] p-3">
        {files.map((file, index) => (
          <div key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-3 py-1 text-xs text-[#555]">
            <span className="truncate">{file.name}</span>
            <span className="shrink-0 text-[#888]">{(file.size / 1_000_000).toFixed(1)} MB</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Autor" name="author" defaultValue="" required placeholder="Nombre del autor o equipo" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="batch-category" className="mb-1.5 block text-xs font-semibold text-[#444]">Categoría</label>
            <select id="batch-category" name="category" defaultValue="" required className="form-control">
              <option value="" disabled>Selecciona una categoría</option>
              {documentCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
          <FormField label="Versión" name="version" defaultValue="1.0" required />
        </div>
        <FormField label="Etiquetas (opcional)" name="tags" defaultValue="" placeholder="Separadas por comas" />
        <div className="flex justify-end gap-2 border-t border-[#eeeeee] pt-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#dedede] px-4 py-2.5 text-sm font-semibold text-[#555] hover:bg-[#f8f8f8]">Cancelar</button>
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#ed1c24] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#c41219]">
            <Icon name="upload" className="h-4 w-4" /> Iniciar carga
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#171717]/45 p-4" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section role="dialog" aria-modal="true" aria-label={title} className="modal-enter max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.2)] sm:p-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-[#222]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-lg text-[#777] hover:bg-[#f5f5f5]"><Icon name="close" /></button>
        </div>
        {children}
      </section>
    </div>
  )
}

function FormField({ label, name, defaultValue, required = false, placeholder }: { label: string; name: string; defaultValue: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={`batch-${name}`} className="mb-1.5 block text-xs font-semibold text-[#444]">{label}</label>
      <input id={`batch-${name}`} name={name} defaultValue={defaultValue} placeholder={placeholder} required={required} className="form-control" />
    </div>
  )
}
