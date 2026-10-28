import type { FormEvent, ReactNode } from 'react'
import type { DocumentForm, DocumentItem } from '../interfaces/document.interface'
import { documentCategories } from '../data/mockDocuments'
import { Icon } from './Icon'

interface DocumentModalsProps {
  editingDocument: DocumentItem | null
  deletingDocument: DocumentItem | null
  onCloseEdit: () => void
  onCloseDelete: () => void
  onSave: (id: string, form: DocumentForm) => void
  onDelete: () => void
}

export function DocumentModals({ editingDocument, deletingDocument, onCloseEdit, onCloseDelete, onSave, onDelete }: DocumentModalsProps) {
  return (
    <>
      {editingDocument && <EditDocumentModal key={editingDocument.id} document={editingDocument} onClose={onCloseEdit} onSave={onSave} />}
      {deletingDocument && <DeleteDocumentModal document={deletingDocument} onClose={onCloseDelete} onDelete={onDelete} />}
    </>
  )
}

function EditDocumentModal({ document, onClose, onSave }: { document: DocumentItem; onClose: () => void; onSave: (id: string, form: DocumentForm) => void }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    onSave(document.id, {
      title: String(data.get('title')).trim(),
      author: String(data.get('author')).trim(),
      category: String(data.get('category')),
      version: String(data.get('version')).trim(),
      tags: String(data.get('tags')),
    })
  }

  return (
    <Modal title="Editar documento" onClose={onClose}>
      <p className="mb-5 text-sm text-[#707070]">Actualiza los metadatos de <span className="font-medium text-[#333]">{document.filename}</span>.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Título" name="title" defaultValue={document.title} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Autor" name="author" defaultValue={document.author} required />
          <FormField label="Versión" name="version" defaultValue={document.version} required />
        </div>
        <div>
          <label htmlFor="document-category" className="mb-1.5 block text-xs font-semibold text-[#444]">Categoría</label>
          <select id="document-category" name="category" defaultValue={document.category} className="form-control">
            {documentCategories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </div>
        <FormField label="Etiquetas" name="tags" defaultValue={document.tags.join(', ')} placeholder="Separadas por comas" />
        <div className="flex justify-end gap-2 border-t border-[#eeeeee] pt-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#dedede] px-4 py-2.5 text-sm font-semibold text-[#555] hover:bg-[#f8f8f8]">Cancelar</button>
          <button type="submit" className="rounded-lg bg-[#ed1c24] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#c41219]">Guardar cambios</button>
        </div>
      </form>
    </Modal>
  )
}

function DeleteDocumentModal({ document, onClose, onDelete }: { document: DocumentItem; onClose: () => void; onDelete: () => void }) {
  return (
    <Modal title="Eliminar documento" onClose={onClose}>
      <p className="text-sm leading-6 text-[#666]">¿Seguro que quieres eliminar <span className="font-semibold text-[#222]">{document.title}</span>? Esta acción no se puede deshacer.</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-[#dedede] px-4 py-2.5 text-sm font-semibold text-[#555] hover:bg-[#f8f8f8]">Cancelar</button>
        <button type="button" onClick={onDelete} className="rounded-lg bg-[#de350b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#bd2c09]">Eliminar documento</button>
      </div>
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
      <label htmlFor={`document-${name}`} className="mb-1.5 block text-xs font-semibold text-[#444]">{label}</label>
      <input id={`document-${name}`} name={name} defaultValue={defaultValue} placeholder={placeholder} required={required} className="form-control" />
    </div>
  )
}
