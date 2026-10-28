import type { DocumentStatus } from '../types/document.type'
import { Icon } from './Icon'

const statusDetails = {
  INDEXED: { label: 'Indexado', classes: 'bg-emerald-50 text-emerald-700', icon: 'check' },
  PROCESSING: { label: 'Procesando', classes: 'bg-amber-50 text-amber-700', icon: 'clock' },
  ERROR: { label: 'Error', classes: 'bg-rose-50 text-rose-700', icon: 'alert' },
} as const

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const details = statusDetails[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${details.classes}`}>
      <Icon name={details.icon} className={`h-3.5 w-3.5 ${status === 'PROCESSING' ? 'animate-spin' : ''}`} />
      {details.label}
    </span>
  )
}
