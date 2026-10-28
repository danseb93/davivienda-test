import type { SummaryAccent } from '../types/document.type'
import { Icon } from './Icon'

interface SummaryCardProps {
  label: string
  value: number
  note: string
  icon: 'file' | 'check' | 'clock'
  accent: SummaryAccent
}

const accentClasses: Record<SummaryAccent, string> = {
  red: 'bg-[#fff0f0] text-[#c41219]',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
}

export function DocumentSummary({ total, indexed, processing, errors }: { total: number; indexed: number; processing: number; errors: number }) {
  return (
    <section className="mb-6 grid gap-4 sm:grid-cols-3" aria-label="Resumen de documentos">
      <SummaryCard label="Total de documentos" value={total} note="En tu biblioteca" icon="file" accent="red" />
      <SummaryCard label="Indexados" value={indexed} note="Disponibles para búsqueda" icon="check" accent="green" />
      <SummaryCard label="En procesamiento" value={processing} note={errors ? `${errors} con error` : 'Actualizado en tiempo real'} icon="clock" accent="amber" />
    </section>
  )
}

function SummaryCard({ label, value, note, icon, accent }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-[#e9e9e9] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#707070]">{label}</p>
          <p className="mt-2 text-[28px] font-bold leading-8 tracking-tight text-[#1a1a1a]">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClasses[accent]}`}><Icon name={icon} className="h-5 w-5" /></span>
      </div>
      <p className="mt-3 text-xs text-[#8a8a8a]">{note}</p>
    </div>
  )
}
