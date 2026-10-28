import { Icon } from './Icon'

interface DocumentHeaderProps {
  onUpload: () => void
  onNotifications: () => void
}

export function DocumentHeader({ onUpload, onNotifications }: DocumentHeaderProps) {
  return (
    <>
      <header className="border-b border-[#e7e7e7] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a className="flex items-center gap-3" href="#" aria-label="Davivienda Documentos, inicio">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ed1c24] text-white shadow-sm">
              <Icon name="file" className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-bold tracking-tight text-[#1a1a1a]">Documentos</span>
              <span className="text-xs text-[#707070]">Centro de conocimiento</span>
            </span>
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[#707070] sm:inline">Biblioteca de documentos</span>
            <button type="button" onClick={onNotifications} aria-label="Ver notificaciones" className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#555] transition hover:bg-gray-100">
              <Icon name="bell" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ed1c24]" />
            </button>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff0f0] text-xs font-bold text-[#c41219]">DP</span>
          </div>
        </div>
      </header>
      <div className="mx-auto mb-8 mt-9 flex max-w-[1440px] flex-col justify-between gap-5 px-5 sm:flex-row sm:items-end sm:px-8 lg:px-12">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-[#c41219]">
            <Icon name="spark" className="h-4 w-4" />
            Tu espacio de conocimiento
          </p>
          <h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-[#1a1a1a] sm:text-4xl">Documentos</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#707070] sm:text-base">
            Organiza, encuentra y consulta la documentación de tu equipo desde un solo lugar.
          </p>
        </div>
        <button type="button" onClick={onUpload} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#ed1c24] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c41219] focus:outline-none focus:ring-4 focus:ring-red-100">
          <Icon name="upload" className="h-[18px] w-[18px]" />
          Cargar documentos
        </button>
      </div>
    </>
  )
}
