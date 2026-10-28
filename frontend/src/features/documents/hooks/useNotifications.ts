import { useCallback, useEffect, useRef, useState } from 'react'
import type { ToastKind } from '../types/document.type'
import type { ToastMessage } from '../interfaces/document.interface'
import { createId } from '../utils/documentUtils'

export function useNotifications() {
  const [notifications, setNotifications] = useState<ToastMessage[]>([])
  const timeouts = useRef(new Map<string, number>())

  useEffect(() => () => {
    timeouts.current.forEach(window.clearTimeout)
  }, [])

  const dismiss = useCallback((id: string) => {
    const timeout = timeouts.current.get(id)
    if (timeout) window.clearTimeout(timeout)
    timeouts.current.delete(id)
    setNotifications((current) => current.filter((notification) => notification.id !== id))
  }, [])

  const notify = useCallback((kind: ToastKind, title: string, message: string) => {
    const id = createId()
    setNotifications((current) => [...current, { id, kind, title, message }])
    timeouts.current.set(id, window.setTimeout(() => dismiss(id), 5_500))
  }, [dismiss])

  return { notifications, notify, dismiss }
}
