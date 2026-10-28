import type { ToastMessage } from '../interfaces/document.interface'
import { Icon } from './Icon'

export function ToastViewport({ notifications, onDismiss }: { notifications: ToastMessage[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:bottom-6 sm:right-6" aria-live="polite">
      {notifications.map((notification) => (
        <div key={notification.id} className="toast-enter flex gap-3 rounded-xl border border-[#eeeeee] bg-white p-4 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notification.kind === 'success' ? 'bg-emerald-50 text-emerald-600' : notification.kind === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
            <Icon name={notification.kind === 'success' ? 'check' : notification.kind === 'error' ? 'alert' : 'bell'} className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#222]">{notification.title}</p>
            <p className="mt-1 text-xs leading-5 text-[#707070]">{notification.message}</p>
          </div>
          <button type="button" onClick={() => onDismiss(notification.id)} aria-label="Cerrar notificación" className="h-6 text-[#999] hover:text-[#333]"><Icon name="close" className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  )
}
