import { useState, type DragEvent, type RefObject } from "react";
import { Icon } from "./Icon";

interface UploadDropzoneProps {
  inputRef: RefObject<HTMLInputElement | null>;
  onFiles: (files: FileList | File[]) => void;
}

export function UploadDropzone({ inputRef, onFiles }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    onFiles(event.dataTransfer.files);
  }

  function handleFiles(files: FileList | null) {
    if (files) onFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setIsDragging(false);
      }}
      onDrop={handleDrop}
      className={`mb-7 rounded-2xl border border-dashed px-5 py-5 transition sm:px-7 ${isDragging ? "border-[#ed1c24] bg-red-50" : "border-[#d7d7d7] bg-white"}`}
    >
      <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fff1f1] text-[#ed1c24]">
            <Icon name="upload" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#222]">
              Arrastra tus documentos aquí
            </p>
            <p className="mt-1 text-xs text-[#707070]">
              PDF, TXT o Markdown · Máximo 25 MB por archivo
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#ed1c24] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c41219] focus:outline-none focus:ring-4 focus:ring-red-100"
        >
          <Icon name="upload" className="h-[18px] w-[18px]" />
          Cargar documentos{" "}
        </button>
      </div>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept=".pdf,.txt,.md,.markdown"
        multiple
        onChange={(event) => handleFiles(event.target.files)}
        aria-label="Seleccionar documentos para cargar"
      />
    </section>
  );
}
