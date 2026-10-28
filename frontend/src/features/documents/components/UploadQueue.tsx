import type { UploadItem } from '../interfaces/document.interface'
import { formatFileSize } from '../utils/documentUtils'
import { Icon } from './Icon'

interface UploadQueueProps {
  uploads: UploadItem[]
  onClearCompleted: () => void
}

export function UploadQueue({ uploads, onClearCompleted }: UploadQueueProps) {
  if (!uploads.length) return null

  return (
    <section className="mb-7 rounded-2xl border border-[#e7e7e7] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:p-6" aria-label="Progreso de carga">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#222]">Actividad de carga</h2>
          <p className="mt-1 text-xs text-[#707070]">La indexación puede continuar después de completar la carga.</p>
        </div>
        <button type="button" onClick={onClearCompleted} className="text-xs font-semibold text-[#707070] hover:text-[#c41219]">Limpiar completados</button>
      </div>
      <div className="space-y-4">
        {uploads.map((upload) => (
          <div key={upload.id} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5] text-[#707070]"><Icon name="file" className="h-[18px] w-[18px]" /></span>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p className="truncate text-sm font-medium text-[#333]">{upload.filename}</p>
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-[#707070]">
                  {upload.stage === 'uploading' && `${upload.progress}%`}
                  {upload.stage === 'processing' && <><Icon name="clock" className="h-3.5 w-3.5 animate-spin" /> Procesando e indexando</>}
                  {upload.stage === 'done' && <><Icon name="check" className="h-3.5 w-3.5 text-emerald-600" /> Cargado e indexado</>}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#eeeeee]">
                <div className={`h-full rounded-full transition-all duration-300 ${upload.stage === 'done' ? 'bg-emerald-500' : upload.stage === 'processing' ? 'bg-amber-400' : 'bg-[#ed1c24]'}`} style={{ width: `${upload.progress}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-[#8a8a8a]">{formatFileSize(upload.size)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
