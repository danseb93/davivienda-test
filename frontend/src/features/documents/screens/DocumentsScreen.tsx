import { useEffect, useRef, useState } from "react";
import type { ApiSearchResult } from "../interfaces/api.interface";
import type { DocumentItem } from "../interfaces/document.interface";
import type { UploadMetadata } from "../interfaces/api.interface";
import { BulkUploadModal } from "../components/BulkUploadModal";
import { DocumentHeader } from "../components/DocumentHeader";
import { DocumentModals } from "../components/DocumentModals";
import { DocumentSummary } from "../components/DocumentSummary";
import { DocumentTable } from "../components/DocumentTable";
import { DocumentViewer } from "../components/DocumentViewer";
import { ToastViewport } from "../components/ToastViewport";
import { UploadDropzone } from "../components/UploadDropzone";
import { UploadQueue } from "../components/UploadQueue";
import { maxBatchFiles } from "../config/documentConfig";
import { useDocumentSearch } from "../hooks/useDocumentSearch";
import { useDocumentViewer } from "../hooks/useDocumentViewer";
import { useDocuments } from "../hooks/useDocuments";
import { useNotifications } from "../hooks/useNotifications";
import { isSupportedFile } from "../utils/documentUtils";

function DocumentsScreen() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { notifications, notify, dismiss } = useNotifications();
  const documents = useDocuments(notify);
  const search = useDocumentSearch();
  const clearSearch = search.clear;
  const runSearch = search.search;
  const viewer = useDocumentViewer();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);

    const term = documents.query.trim();
    if (
      !term ||
      documents.isLoading ||
      documents.filteredDocuments.length > 0
    ) {
      clearSearch();
      return;
    }

    clearSearch();
    searchTimer.current = setTimeout(() => {
      void runSearch(term);
    }, 500);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [
    clearSearch,
    documents.filteredDocuments.length,
    documents.isLoading,
    documents.query,
    runSearch,
  ]);

  function prepareFiles(files: FileList | File[]) {
    const selected = Array.from(files);
    if (selected.length > maxBatchFiles) {
      notify(
        "error",
        `Máximo ${maxBatchFiles} documentos por lote`,
        `Selecciona hasta ${maxBatchFiles} archivos en cada carga.`,
      );
      return;
    }
    const accepted = selected.filter((file) => {
      if (isSupportedFile(file.name)) return true;
      notify(
        "error",
        "Formato no compatible",
        `${file.name}: selecciona un archivo PDF, TXT o Markdown.`,
      );
      return false;
    });
    setSelectedFiles(accepted);
  }

  async function submitBatch(metadata: Omit<UploadMetadata, "title">) {
    const files = selectedFiles;
    setSelectedFiles([]);
    await documents.uploadFiles(files, metadata);
  }

  function submitSearch() {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    void runSearch(documents.query);
  }

  function openSearchResult(result: ApiSearchResult) {
    viewer.open(result.id, search.submittedQuery);
  }

  function openDocument(document: DocumentItem) {
    viewer.open(document.id);
  }

  function handleSearchPage(page: number) {
    void search.search(search.submittedQuery, page);
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-[#222222]">
      <DocumentHeader />
      <main className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-8 lg:px-12">
        <DocumentSummary
          total={documents.counts.total}
          indexed={documents.counts.indexed}
          processing={documents.counts.processing}
          errors={documents.counts.error}
        />
        <UploadDropzone inputRef={fileInputRef} onFiles={prepareFiles} />
        <UploadQueue
          uploads={documents.uploads}
          onClearCompleted={documents.clearCompletedUploads}
        />
        <DocumentTable
          documents={documents.filteredDocuments}
          counts={documents.counts}
          isLoading={documents.isLoading}
          query={documents.query}
          activeFilter={documents.activeFilter}
          onQueryChange={documents.setQuery}
          onFilterChange={documents.setActiveFilter}
          onSearch={submitSearch}
          searchResults={search.results}
          isSearching={search.isSearching}
          searchError={search.error}
          pagination={documents.pagination}
          onPageChange={documents.setPage}
          onSearchResultOpen={openSearchResult}
          onSearchPageChange={handleSearchPage}
          onOpen={openDocument}
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
      {selectedFiles.length > 0 && (
        <BulkUploadModal
          files={selectedFiles}
          onClose={() => setSelectedFiles([])}
          onSubmit={(metadata) => void submitBatch(metadata)}
        />
      )}
      <DocumentViewer
        isOpen={viewer.isOpen}
        document={viewer.document}
        objectUrl={viewer.objectUrl}
        previewUrl={viewer.previewUrl}
        text={viewer.text}
        searchTerm={viewer.searchTerm}
        isLoading={viewer.isLoading}
        error={viewer.error}
        onClose={viewer.close}
        onRetry={viewer.retry}
      />
      <ToastViewport notifications={notifications} onDismiss={dismiss} />
    </div>
  );
}

export default DocumentsScreen;
