import { Icon } from "./Icon";

export function DocumentHeader() {
  return (
    <>
      <header className="border-b border-[#e7e7e7] bg-gradient-to-r from-red-700 via-red-600 to-red-500">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a
            className="flex items-center gap-3"
            href="#"
            aria-label="Davivienda Documentos, inicio"
          >
            <span className="leading-tight">
              <img src="/LogoDavivienda.svg" alt="Logo Davivienda" />
              <span className="text-xs text-white">Centro de conocimiento</span>
            </span>
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white sm:inline">
              Biblioteca de documentos
            </span>
          </div>
        </div>
      </header>
      <div className="mx-auto mb-8 mt-9 flex max-w-[1440px] sm:items-end sm:px-8 lg:px-12">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-[#c41219]">
            <Icon name="spark" className="h-4 w-4" />
            Tu espacio de conocimiento
          </p>
          <h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-[#1a1a1a] sm:text-4xl">
            Documentos
          </h1>
          <p className="mt-2 text-sm text-[#707070] sm:text-base">
            Organiza, encuentra y consulta la documentación de tu equipo desde un solo lugar.
          </p>
        </div>
      </div>
    </>
  );
}
