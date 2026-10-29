import { Icon } from "./Icon";

export function DocumentHeader() {
  return (
<>
  {/* Header Superior */}
  <header className="border-b border-[#e7e7e7] bg-gradient-to-r from-red-700 via-red-600 to-red-500">
    <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:px-12">
      <a
        className="flex items-center gap-3 overflow-hidden"
        href="#"
        aria-label="Davivienda Documentos, inicio"
      >
        <span className="leading-tight">
          <img src="/LogoDavivienda.svg" alt="Logo Davivienda" className="h-7 w-auto" />
          <span className="text-[11px] text-white sm:text-xs">Centro de conocimiento</span>
        </span>
      </a>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-white sm:inline">
          Biblioteca de documentos
        </span>
      </div>
    </div>
  </header>

  {/* Sección de Título y Descripción */}
<div className="mx-auto mb-8 mt-6 max-w-[1440px] px-4 sm:mt-9 sm:px-8 lg:px-12">
  <div>
    <p className="mb-2 flex items-center gap-2 text-xs font-medium text-[#c41219] sm:text-sm">
      <Icon name="spark" className="h-4 w-4 shrink-0" />
      Tu espacio de conocimiento
    </p>
    <h1 className="text-2xl font-bold leading-tight tracking-[-0.035em] text-[#1a1a1a] sm:text-3xl lg:text-4xl">
      Documentos
    </h1>
    <p className="mt-2 text-xs text-[#707070] sm:text-base">
      Organiza, encuentra y consulta la documentación de tu equipo desde
      un solo lugar.
    </p>
  </div>
</div>
</> 
  );
}
