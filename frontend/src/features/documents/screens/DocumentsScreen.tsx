import { useRef } from 'react'
import { DocumentHeader } from '../components/DocumentHeader'
import { DocumentModals } from '../components/DocumentModals'
import { DocumentSummary } from '../components/DocumentSummary'
import { DocumentTable } from '../components/DocumentTable'
import { ToastViewport } from '../components/ToastViewport'
import { UploadDropzone } from '../components/UploadDropzone'
import { UploadQueue } from '../components/UploadQueue'
import { useDocuments } from '../hooks/useDocuments'
import { useNotifications } from '../hooks/useNotifications'

function DocumentsScreen() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { notifications, notify, dismiss } = useNotifications()
  const documents = useDocuments(notify)

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-[#222222]">
      <DocumentHeader
        onUpload={() => fileInputRef.current?.click()}
        onNotifications={() => notify('info', 'Notificaciones', 'Aquí verás las actualizaciones de tus documentos.')}
      />
      <main className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-8 lg:px-12">
        <DocumentSummary
          total={documents.counts.total}
          indexed={documents.counts.indexed}
          processing={documents.counts.processing}
          errors={documents.counts.error}
        />
        <UploadDropzone inputRef={fileInputRef} onFiles={documents.addFiles} />
        <UploadQueue uploads={documents.uploads} onClearCompleted={documents.clearCompletedUploads} />
        <DocumentTable
          documents={documents.filteredDocuments}
          counts={documents.counts}
          query={documents.query}
          activeFilter={documents.activeFilter}
          onQueryChange={documents.setQuery}
          onFilterChange={documents.setActiveFilter}
          onEdit={documents.setEditingDocument}
          onDelete={documents.setDeletingDocument}
        />
      </main>
      <DocumentModals
        editingDocument={documents.editingDocument}
        deletingDocument={documents.deletingDocument}
        onCloseEdit={() => documents.setEditingDocument(null)}
        onCloseDelete={() => documents.setDeletingDocument(null)}
        onSave={documents.saveDocument}
        onDelete={documents.deleteDocument}
      />
      <ToastViewport notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}

export default DocumentsScreen
